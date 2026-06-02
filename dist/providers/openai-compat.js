import { ModelProvider, } from '../types/index.js';
export class OpenAICompatProvider extends ModelProvider {
    apiKey;
    baseUrl;
    defaultModel;
    constructor(apiKey, baseUrl, defaultModel) {
        super();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
    }
    get id() {
        return 'openai-compat';
    }
    get name() {
        return 'OpenAI-Compatible Endpoint';
    }
    get models() {
        return [
            {
                id: this.defaultModel,
                name: `Custom Model (${this.defaultModel})`,
                contextWindow: 128000, // Assume generous context
                supportsTools: true,
                supportsImages: false,
            },
        ];
    }
    async *chat(messages, options = {}) {
        const model = options.model || this.defaultModel;
        const tools = options.tools || [];
        const requestBody = {
            model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                tool_call_id: m.toolCallId,
                tool_calls: m.toolCalls?.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.input),
                    },
                })),
            })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
            stream: true,
            tools: tools.length > 0 ? tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.inputSchema,
                },
            })) : undefined,
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI-compat API error: ${response.status} - ${error}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let toolCallBuffer = {};
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim().startsWith('data:')) {
                    const data = line.trim().slice(5);
                    if (data === '[DONE]')
                        continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                        const finishReason = parsed.choices?.[0]?.finish_reason;
                        if (content) {
                            yield { type: 'content', content };
                        }
                        if (toolCalls && toolCalls.length > 0) {
                            for (const tc of toolCalls) {
                                const index = tc.index;
                                if (!toolCallBuffer[index]) {
                                    toolCallBuffer[index] = { id: tc.id, name: '', arguments: '' };
                                }
                                if (tc.function?.name) {
                                    toolCallBuffer[index].name = tc.function.name;
                                }
                                if (tc.function?.arguments) {
                                    toolCallBuffer[index].arguments += tc.function.arguments;
                                }
                            }
                        }
                        if (finishReason === 'stop' || finishReason === 'tool_calls') {
                            for (const tc of Object.values(toolCallBuffer)) {
                                if (tc.name && tc.arguments) {
                                    yield {
                                        type: 'tool_call',
                                        toolCall: {
                                            id: tc.id,
                                            name: tc.name,
                                            input: JSON.parse(tc.arguments),
                                        },
                                    };
                                }
                            }
                            toolCallBuffer = {};
                            yield { type: 'done' };
                            return;
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
            }
        }
    }
    async countTokens(messages) {
        // Generic estimate
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 1.5);
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow || 128000;
    }
}
//# sourceMappingURL=openai-compat.js.map
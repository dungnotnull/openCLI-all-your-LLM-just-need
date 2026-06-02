import { ModelProvider, } from '../types/index.js';
const DEVSTRAL_API_BASE = 'https://api.mistral.ai/v1';
export class DevstralProvider extends ModelProvider {
    apiKey;
    baseUrl;
    constructor(apiKey = process.env.DEVSTRAL_API_KEY || '', baseUrl = DEVSTRAL_API_BASE) {
        super();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    get id() {
        return 'devstral';
    }
    get name() {
        return 'Devstral (Mistral)';
    }
    get models() {
        return [
            {
                id: 'devstral-small-2',
                name: 'Devstral Small 2 (24B, Apache 2.0, 68% SWE-bench)',
                contextWindow: 32000,
                supportsTools: true,
                supportsImages: true, // Multimodal support
            },
            {
                id: 'devstral-medium',
                name: 'Devstral Medium',
                contextWindow: 32000,
                supportsTools: true,
                supportsImages: true,
            },
        ];
    }
    async *chat(messages, options = {}) {
        const model = options.model || 'devstral-small-2';
        const tools = options.tools || [];
        // Devstral/Mistral supports multimodal content
        const processedMessages = messages.map(m => ({
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
        }));
        const requestBody = {
            model,
            messages: processedMessages,
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
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Devstral API error: ${response.status} - ${error}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }
        const decoder = new TextDecoder();
        let buffer = '';
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
                                if (tc.function?.name && tc.function?.arguments) {
                                    yield {
                                        type: 'tool_call',
                                        toolCall: {
                                            id: tc.id,
                                            name: tc.function.name,
                                            input: JSON.parse(tc.function.arguments),
                                        },
                                    };
                                }
                            }
                        }
                        if (finishReason === 'stop' || finishReason === 'tool_calls') {
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
        // Devstral uses roughly 1.3 chars per token
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 1.3);
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow || 32000;
    }
}
//# sourceMappingURL=devstral.js.map
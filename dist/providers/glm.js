import { ModelProvider, } from '../types/index.js';
const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
export class GLMProvider extends ModelProvider {
    apiKey;
    constructor(apiKey = process.env.GLM_API_KEY || '') {
        super();
        this.apiKey = apiKey;
    }
    get id() {
        return 'glm';
    }
    get name() {
        return 'GLM (Zhipu AI)';
    }
    get models() {
        return [
            {
                id: 'glm-5.1',
                name: 'GLM-5.1 (Competitive on LiveBench May 2026)',
                contextWindow: 128000,
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'glm-4-flash',
                name: 'GLM-4 Flash (Fast, for orchestrator)',
                contextWindow: 128000,
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'glm-4-plus',
                name: 'GLM-4 Plus',
                contextWindow: 128000,
                supportsTools: true,
                supportsImages: false,
            },
        ];
    }
    async *chat(messages, options = {}) {
        const model = options.model || 'glm-5.1';
        const tools = options.tools || [];
        // GLM has a built-in web_search tool - if enabled, add it
        const toolIds = tools.map(t => t.name);
        const useWebSearch = toolIds.includes('web_search');
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
            tools: useWebSearch ? [{
                    type: 'web_search',
                    web_search: {
                        enable: true,
                        search_result: true,
                    },
                }] : tools.length > 0 ? tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.inputSchema,
                },
            })) : undefined,
        };
        const response = await fetch(`${GLM_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GLM API error: ${response.status} - ${error}`);
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
                            // Yield any accumulated tool calls
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
        // GLM uses roughly 1.3 chars per token
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 1.3);
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow || 128000;
    }
}
//# sourceMappingURL=glm.js.map
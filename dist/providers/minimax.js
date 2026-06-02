import { ModelProvider, } from '../types/index.js';
const MINIMAX_API_BASE = 'https://api.minimax.chat/v1';
export class MinimaxProvider extends ModelProvider {
    apiKey;
    constructor(apiKey = process.env.MINIMAX_API_KEY || '') {
        super();
        this.apiKey = apiKey;
    }
    get id() {
        return 'minimax';
    }
    get name() {
        return 'Minimax';
    }
    get models() {
        return [
            {
                id: 'abab6.5s-chat',
                name: 'MiniMax ABAB6.5s',
                contextWindow: 1000000, // 1M tokens - largest available
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'abab6.5-chat',
                name: 'MiniMax ABAB6.5',
                contextWindow: 1000000,
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'abab5.5-chat',
                name: 'MiniMax ABAB5.5',
                contextWindow: 245000,
                supportsTools: true,
                supportsImages: false,
            },
        ];
    }
    async *chat(messages, options = {}) {
        const model = options.model || this.models[0]?.id || 'abab6.5s-chat';
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
            bot_setting: {
                bot_name: 'OpenCLI',
                content: 'You are a helpful AI coding assistant.',
            },
        };
        const response = await fetch(`${MINIMAX_API_BASE}/text/chatcompletion_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Minimax API error: ${response.status} - ${error}`);
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
                        if (finishReason === 'stop') {
                            yield { type: 'done' };
                            return;
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON
                        continue;
                    }
                }
            }
        }
    }
    async countTokens(messages) {
        // Minimax uses roughly 1.5 chars per token for English
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 1.5);
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow || 1000000;
    }
}
//# sourceMappingURL=minimax.js.map
import { ModelProvider, } from '../types/index.js';
const KIMI_API_BASE = 'https://api.moonshot.cn/v1';
class RetryError extends Error {
    retryAfter;
    constructor(message, retryAfter = 1) {
        super(message);
        this.retryAfter = retryAfter;
        this.name = 'RetryError';
    }
}
export class KimiProvider extends ModelProvider {
    apiKey;
    maxRetries = 5;
    constructor(apiKey = process.env.KIMI_API_KEY || '') {
        super();
        this.apiKey = apiKey;
    }
    get id() {
        return 'kimi';
    }
    get name() {
        return 'Kimi (Moonshot AI)';
    }
    get models() {
        return [
            {
                id: 'moonshot-v1-128k',
                name: 'Kimi K2.6 (LiveBench May 2026 Leader)',
                contextWindow: 128000,
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'moonshot-v1-32k',
                name: 'Kimi Moonshot v1 32K',
                contextWindow: 32000,
                supportsTools: true,
                supportsImages: false,
            },
            {
                id: 'moonshot-v1-8k',
                name: 'Kimi Moonshot v1 8K',
                contextWindow: 8000,
                supportsTools: true,
                supportsImages: false,
            },
        ];
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async fetchWithRetry(url, options, attempt = 1) {
        try {
            const response = await fetch(url, options);
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
                const waitTime = Math.pow(2, attempt) * 1000 + retryAfter * 1000;
                if (attempt < this.maxRetries) {
                    await this.sleep(waitTime);
                    return this.fetchWithRetry(url, options, attempt + 1);
                }
                throw new RetryError('Max retries exceeded for rate limit', retryAfter);
            }
            // Handle server errors
            if (response.status >= 500) {
                if (attempt < this.maxRetries) {
                    await this.sleep(Math.pow(2, attempt) * 1000);
                    return this.fetchWithRetry(url, options, attempt + 1);
                }
                throw new Error(`Server error: ${response.status}`);
            }
            return response;
        }
        catch (error) {
            if (error instanceof RetryError) {
                throw error;
            }
            if (attempt < this.maxRetries) {
                await this.sleep(Math.pow(2, attempt) * 1000);
                return this.fetchWithRetry(url, options, attempt + 1);
            }
            throw error;
        }
    }
    async *chat(messages, options = {}) {
        const model = options.model || 'moonshot-v1-128k';
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
        const response = await this.fetchWithRetry(`${KIMI_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Kimi API error: ${response.status} - ${error}`);
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
        // Kimi uses roughly 1.3 chars per token
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 1.3);
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow || 32000;
    }
}
//# sourceMappingURL=kimi.js.map
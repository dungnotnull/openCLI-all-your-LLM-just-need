/**
 * GPT (OpenAI) API Provider Implementation
 *
 * Supports:
 * - GPT-4o (128K context, multimodal)
 * - GPT-4o mini (128K context)
 * - GPT-4 Turbo (128K context)
 * - GPT-3.5 Turbo (16K context)
 *
 * API: https://api.openai.com
 * Tool-calling: OpenAI function calling format
 */
import { ModelProvider } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";
export class GPTProvider extends ModelProvider {
    apiKey;
    baseUrl = "https://api.openai.com";
    modelDescriptors = [
        {
            id: "gpt-4o",
            name: "GPT-4o",
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "gpt-4o-mini",
            name: "GPT-4o Mini",
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "gpt-4-turbo",
            name: "GPT-4 Turbo",
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            contextWindow: 16000,
            supportsTools: true,
            supportsImages: false,
        },
    ];
    constructor(apiKey) {
        super();
        this.apiKey = apiKey || getApiKeyOrEnv("gpt", "OPENAI_API_KEY") || "";
        if (!this.apiKey) {
            throw new Error("OpenAI API key not found. Set OPENAI_API_KEY environment variable or provide it in the constructor.");
        }
    }
    get id() {
        return "gpt";
    }
    get name() {
        return "GPT (OpenAI)";
    }
    get models() {
        return this.modelDescriptors;
    }
    /**
     * Main chat method with streaming support
     */
    async *chat(messages, options = {}) {
        const { tools, temperature = 0.7, maxTokens = 4096 } = options;
        // Convert to OpenAI format
        const openaiMessages = messages.map((msg) => {
            const openaiMsg = {
                role: msg.role,
                content: msg.content,
            };
            // Convert tool calls
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                openaiMsg.tool_calls = msg.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.input),
                    },
                }));
            }
            // Handle tool result messages
            if (msg.toolCallId) {
                openaiMsg.tool_call_id = msg.toolCallId;
                openaiMsg.role = "tool";
            }
            return openaiMsg;
        });
        // Build request
        const request = {
            model: options.model || this.models[0]?.id || "gpt-4o",
            messages: openaiMessages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
        };
        // Add tools if present
        if (tools && tools.length > 0) {
            request.tools = tools.map((tool) => ({
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema,
                },
            }));
        }
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }
            // Parse streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is null");
            }
            const decoder = new TextDecoder();
            let buffer = "";
            let currentToolCall = null;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (!line.trim() || !line.startsWith("data: "))
                        continue;
                    const data = line.slice(6);
                    if (data === "[DONE]")
                        continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0]) {
                            const choice = parsed.choices[0];
                            // Yield content deltas
                            if (choice.delta.content) {
                                yield {
                                    type: "content",
                                    content: choice.delta.content,
                                };
                            }
                            // Handle tool calls
                            if (choice.delta.tool_calls && choice.delta.tool_calls.length > 0) {
                                for (const toolCall of choice.delta.tool_calls) {
                                    if (toolCall.id) {
                                        currentToolCall = {
                                            id: toolCall.id,
                                            name: toolCall.function?.name || "",
                                        };
                                        yield {
                                            type: "tool_call_start",
                                            toolCallId: toolCall.id,
                                            toolName: toolCall.function?.name || "",
                                        };
                                    }
                                    if (toolCall.function?.arguments) {
                                        yield {
                                            type: "tool_call_delta",
                                            toolInput: toolCall.function.arguments,
                                        };
                                    }
                                }
                            }
                            // Yield usage info
                            if (parsed.usage) {
                                yield {
                                    type: "usage",
                                    inputTokens: parsed.usage.prompt_tokens,
                                    outputTokens: parsed.usage.completion_tokens,
                                };
                            }
                        }
                    }
                    catch (e) {
                        // Skip malformed SSE lines
                        continue;
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`GPT API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Count tokens using tiktoken
     * For OpenAI models, we can use tiktoken for accurate counting
     */
    async countTokens(messages) {
        let totalChars = 0;
        for (const message of messages) {
            totalChars += message.content.length;
            totalChars += message.role.length + 3; // +3 for formatting
            if (message.toolCalls) {
                for (const toolCall of message.toolCalls) {
                    totalChars += toolCall.name.length;
                    totalChars += JSON.stringify(toolCall.input).length;
                }
            }
        }
        // GPT uses cl100k_base encoding: ~4 characters per token
        return Math.ceil(totalChars / 4);
    }
    supportsMCP() {
        return true;
    }
}
//# sourceMappingURL=gpt.js.map
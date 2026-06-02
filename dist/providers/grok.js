/**
 * Grok (xAI) API Provider Implementation
 *
 * Supports:
 * - Grok-2 (vision, 128K context)
 * - Grok-beta (128K context)
 * - Grok-vision-beta (vision)
 *
 * API: https://api.x.ai
 * Tool-calling: OpenAI-compatible format
 */
import { ModelProvider } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";
export class GrokProvider extends ModelProvider {
    apiKey;
    baseUrl = "https://api.x.ai";
    modelDescriptors = [
        {
            id: "grok-2",
            name: "Grok-2",
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "grok-beta",
            name: "Grok Beta",
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: false,
        },
        {
            id: "grok-vision-beta",
            name: "Grok Vision Beta",
            contextWindow: 128000,
            supportsTools: false,
            supportsImages: true,
        },
    ];
    constructor(apiKey) {
        super();
        this.apiKey = apiKey || getApiKeyOrEnv("grok", "XAI_API_KEY") || "";
        if (!this.apiKey) {
            throw new Error("xAI API key not found. Set XAI_API_KEY environment variable or provide it in the constructor.");
        }
    }
    get id() {
        return "grok";
    }
    get name() {
        return "Grok (xAI)";
    }
    get models() {
        return this.modelDescriptors;
    }
    /**
     * Main chat method with streaming support
     */
    async *chat(messages, options = {}) {
        const { tools, temperature = 0.7, maxTokens = 4096 } = options;
        // Convert to Grok format (OpenAI-compatible)
        const grokMessages = messages.map((msg) => {
            const grokMsg = {
                role: msg.role,
                content: msg.content,
            };
            // Convert tool calls
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                grokMsg.tool_calls = msg.toolCalls.map((tc) => ({
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
                grokMsg.tool_call_id = msg.toolCallId;
                grokMsg.role = "tool";
            }
            return grokMsg;
        });
        // Build request
        const request = {
            model: options.model || this.models[0]?.id || "grok-2",
            messages: grokMessages,
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
                throw new Error(`xAI API error: ${response.status} - ${error}`);
            }
            // Parse streaming response (OpenAI-compatible format)
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is null");
            }
            const decoder = new TextDecoder();
            let buffer = "";
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
            throw new Error(`Grok API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Count tokens for Grok models
     */
    async countTokens(messages) {
        let totalChars = 0;
        for (const message of messages) {
            totalChars += message.content.length;
            totalChars += message.role.length + 3;
            if (message.toolCalls) {
                for (const toolCall of message.toolCalls) {
                    totalChars += toolCall.name.length;
                    totalChars += JSON.stringify(toolCall.input).length;
                }
            }
        }
        // Grok uses similar tokenization to GPT: ~4 characters per token
        return Math.ceil(totalChars / 4);
    }
    supportsMCP() {
        return true;
    }
}
//# sourceMappingURL=grok.js.map
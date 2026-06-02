/**
 * Claude (Anthropic) API Provider Implementation
 *
 * Supports:
 * - Claude 3.5 Sonnet (200K context)
 * - Claude 3.5 Sonnet New (20241022)
 * - Claude 3 Opus (200K context)
 * - Claude 3 Haiku (200K context)
 *
 * API: https://api.anthropic.com
 * Tool-calling: Anthropic-compatible format with tool_use and tool_result content blocks
 */
import { ModelProvider } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";
export class ClaudeProvider extends ModelProvider {
    apiKey;
    baseUrl = "https://api.anthropic.com";
    modelDescriptors = [
        {
            id: "claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet (New)",
            contextWindow: 200000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "claude-3-5-sonnet-20240620",
            name: "Claude 3.5 Sonnet",
            contextWindow: 200000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "claude-3-opus-20240229",
            name: "Claude 3 Opus",
            contextWindow: 200000,
            supportsTools: true,
            supportsImages: true,
        },
        {
            id: "claude-3-haiku-20240307",
            name: "Claude 3 Haiku",
            contextWindow: 200000,
            supportsTools: true,
            supportsImages: false,
        },
        {
            id: "claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet (Latest)",
            contextWindow: 200000,
            supportsTools: true,
            supportsImages: true,
        },
    ];
    constructor(apiKey) {
        super();
        this.apiKey = apiKey || getApiKeyOrEnv("claude", "ANTHROPIC_API_KEY") || "";
        if (!this.apiKey) {
            throw new Error("Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable or provide it in the constructor.");
        }
    }
    get id() {
        return "claude";
    }
    get name() {
        return "Claude (Anthropic)";
    }
    get models() {
        return this.modelDescriptors;
    }
    /**
     * Main chat method with streaming support
     */
    async *chat(messages, options = {}) {
        const { tools, temperature = 0.7, maxTokens = 4096 } = options;
        // Convert to Anthropic format
        const anthropicMessages = this.convertToAnthropicFormat(messages);
        // Build request
        const request = {
            model: options.model || this.models[0]?.id || "claude-3-5-sonnet-20241022",
            messages: anthropicMessages,
            max_tokens: maxTokens,
            temperature,
            stream: true,
        };
        // Add system prompt if present
        const systemMessage = messages.find((m) => m.role === "system");
        if (systemMessage) {
            request.system = systemMessage.content;
        }
        // Add tools if present
        if (tools && tools.length > 0) {
            request.tools = tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            }));
        }
        try {
            const response = await fetch(`${this.baseUrl}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${error}`);
            }
            // Parse streaming response
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
                        // Handle different event types
                        if (parsed.type === "content_block_delta") {
                            if (parsed.delta?.type === "text_delta" && parsed.delta.text) {
                                yield {
                                    type: "content",
                                    content: parsed.delta.text,
                                };
                            }
                        }
                        else if (parsed.type === "content_block_start") {
                            // Extract from message content when content_block_start occurs
                            const contentBlock = parsed.message?.content?.[parsed.index || 0];
                            if (contentBlock?.type === "tool_use") {
                                yield {
                                    type: "tool_call_start",
                                    toolCallId: contentBlock.id || `call_${Date.now()}`,
                                    toolName: contentBlock.name || "",
                                };
                            }
                        }
                        else if (parsed.type === "content_block_delta") {
                            if (parsed.delta?.type === "input_json_delta") {
                                yield {
                                    type: "tool_call_delta",
                                    toolInput: parsed.delta?.partial_json || "",
                                };
                            }
                        }
                        else if (parsed.type === "message_stop") {
                            // Message complete
                            if (parsed.usage) {
                                yield {
                                    type: "usage",
                                    inputTokens: parsed.usage.input_tokens,
                                    outputTokens: parsed.usage.output_tokens,
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
            throw new Error(`Claude API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Convert messages to Anthropic format
     */
    convertToAnthropicFormat(messages) {
        const anthropicMessages = [];
        let currentToolUseId = null;
        for (const message of messages) {
            if (message.role === "system") {
                // System messages handled separately in request
                continue;
            }
            if (message.role === "tool") {
                // Tool result message
                anthropicMessages.push({
                    role: "user",
                    content: [
                        {
                            type: "tool_result",
                            tool_use_id: message.toolCallId || "",
                            content: message.content,
                            is_error: false,
                        },
                    ],
                });
                continue;
            }
            // Regular user or assistant message
            const content = [{ type: "text", text: message.content }];
            // Handle tool calls in assistant messages
            if (message.toolCalls && message.toolCalls.length > 0) {
                content.splice(0, 1); // Remove default text block
                for (const toolCall of message.toolCalls) {
                    content.push({
                        type: "tool_use",
                        id: toolCall.id,
                        name: toolCall.name,
                        input: toolCall.input,
                    });
                    currentToolUseId = toolCall.id;
                }
            }
            // Handle images
            if (message.images && message.images.length > 0) {
                for (const image of message.images) {
                    content.push({
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: image.mediaType || "image/png",
                            data: image.data,
                        },
                    });
                }
            }
            anthropicMessages.push({
                role: message.role,
                content,
            });
        }
        return anthropicMessages;
    }
    /**
     * Count tokens using Anthropic's counting approach
     * Claude uses a different tokenizer than tiktoken
     */
    async countTokens(messages) {
        // Approximate: Claude tokens are similar to GPT tokens
        // Use estimation based on character count
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
        // Claude: ~4 characters per token
        return Math.ceil(totalChars / 4);
    }
    supportsMCP() {
        return true;
    }
}
//# sourceMappingURL=claude.js.map
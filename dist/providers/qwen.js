import { ModelProvider } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";
export class QwenProvider extends ModelProvider {
    apiKey;
    baseUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
    // Private field with different name to avoid conflict with getter
    modelDescriptors = [
        {
            id: "qwen3-coder",
            name: "Qwen3-Coder",
            contextWindow: 256000,
            supportsTools: true,
            supportsImages: false,
        },
        {
            id: "qwen3-coder-next",
            name: "Qwen3-Coder-Next",
            contextWindow: 256000,
            supportsTools: true,
            supportsImages: false,
        },
    ];
    constructor(apiKey) {
        super();
        // Try to get API key from parameter, then environment variable
        this.apiKey = apiKey || getApiKeyOrEnv("qwen", "DASHSCOPE_API_KEY") || "";
        if (!this.apiKey) {
            throw new Error("Qwen API key not found. Set DASHSCOPE_API_KEY environment variable or provide it in the constructor.");
        }
    }
    get id() {
        return "qwen";
    }
    get name() {
        return "Qwen";
    }
    get models() {
        return this.modelDescriptors;
    }
    /**
     * Main chat method that implements streaming chat completions
     * Returns an AsyncGenerator that yields deltas as they arrive
     */
    async *chat(messages, options = {}) {
        const { tools, temperature = 0.7, maxTokens, enableThinking } = options;
        // Convert our Message format to Qwen format
        const qwenMessages = messages.map((msg) => {
            const qwenMsg = {
                role: msg.role,
                content: msg.content,
            };
            // Convert tool calls
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                qwenMsg.tool_calls = msg.toolCalls.map((tc) => ({
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
                qwenMsg.tool_call_id = msg.toolCallId;
            }
            return qwenMsg;
        });
        // Convert tools to Qwen format
        let qwenTools;
        if (tools && tools.length > 0) {
            qwenTools = tools.map((tool) => ({
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema,
                },
            }));
        }
        // Build request body according to DashScope API specification
        const requestBody = {
            model: this.modelDescriptors[0]?.id || "qwen3-coder",
            input: {
                messages: qwenMessages,
            },
            parameters: {
                result_format: "message",
                incrementalfalse: false,
                include_usage: true,
            },
        };
        // Add optional parameters
        if (temperature !== undefined) {
            requestBody.parameters.temperature = temperature;
        }
        if (maxTokens) {
            requestBody.parameters.max_tokens = maxTokens;
        }
        if (qwenTools) {
            requestBody.parameters.tools = qwenTools;
        }
        // Qwen-specific: enable_thinking for hybrid reasoning mode
        if (enableThinking) {
            requestBody.parameters.enable_thinking = true;
        }
        // Make streaming request
        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "X-DashScope-SSE": "enable",
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            if (!response.body) {
                throw new Error("Response body is null");
            }
            // Parse SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    // Skip empty lines and comments
                    if (!trimmedLine || trimmedLine.startsWith(":")) {
                        continue;
                    }
                    if (trimmedLine.startsWith("data:")) {
                        const data = trimmedLine.slice(5).trim();
                        // Stream done - DashScope sends empty data chunk or specific marker
                        if (data === "" || data === "[DONE]") {
                            yield { type: "done" };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const choice = parsed.output?.choices?.[0];
                            if (!choice) {
                                continue;
                            }
                            // Yield content delta
                            if (choice.delta?.content) {
                                yield {
                                    type: "content",
                                    content: choice.delta.content,
                                };
                            }
                            // Yield tool call delta
                            if (choice.delta?.tool_calls && choice.delta.tool_calls.length > 0) {
                                for (const toolCallDelta of choice.delta.tool_calls) {
                                    // Tool calls are streamed, so we need to accumulate arguments
                                    if (toolCallDelta.function?.name && toolCallDelta.function?.arguments) {
                                        yield {
                                            type: "tool_call",
                                            toolCall: {
                                                id: toolCallDelta.id || toolCallDelta.index?.toString() || "",
                                                name: toolCallDelta.function.name,
                                                input: JSON.parse(toolCallDelta.function.arguments),
                                            },
                                        };
                                    }
                                }
                            }
                            // Check if stream is finished
                            if (choice.finish_reason && choice.finish_reason !== "null") {
                                yield { type: "done" };
                                return;
                            }
                        }
                        catch (parseError) {
                            console.error("Failed to parse SSE data:", data, parseError);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error("Qwen API request failed:", error);
            throw error;
        }
    }
    /**
     * Count tokens in messages
     * For Phase 1: Simple estimation (4 chars ≈ 1 token for English text)
     * Phase 3 will implement accurate tokenizer integration
     */
    async countTokens(messages) {
        let totalChars = 0;
        for (const message of messages) {
            // Count content characters
            totalChars += message.content.length;
            // Count tool call characters
            if (message.toolCalls) {
                for (const toolCall of message.toolCalls) {
                    totalChars += toolCall.name.length;
                    totalChars += toolCall.id.length;
                    totalChars += JSON.stringify(toolCall.input).length;
                }
            }
        }
        // Rough estimation: 4 characters ≈ 1 token for English text
        // This is a simplification; actual tokenization depends on the model
        // Qwen uses a tokenizer similar to Llama, which may vary for Chinese text
        return Math.ceil(totalChars / 4);
    }
    supportsMCP() {
        return false; // Qwen doesn't support MCP protocol natively
    }
    supportsTools() {
        return true; // All Qwen models support tool calling
    }
    maxContextWindow() {
        // Return the maximum context window across all models
        return Math.max(...this.modelDescriptors.map((m) => m.contextWindow));
    }
}
//# sourceMappingURL=qwen.js.map
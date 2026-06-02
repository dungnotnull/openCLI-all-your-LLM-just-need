import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";

/**
 * DeepSeek API Provider Implementation
 *
 * Supports:
 * - DeepSeek V3 (128K context)
 * - DeepSeek V3.2 with "Thinking in Tool-Use" mode (retain_chain_of_thought)
 * - DeepSeek Chat (64K context)
 *
 * API: https://api.deepseek.com
 * Tool-calling: OpenAI-compatible format
 */

interface DeepSeekMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface DeepSeekTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.deepseek.com";

  // Private field with different name to avoid conflict with getter
  private readonly modelDescriptors: ModelDescriptor[] = [
    {
      id: "deepseek-v3",
      name: "DeepSeek V3",
      contextWindow: 128000,
      supportsTools: true,
      supportsImages: false,
    },
    {
      id: "deepseek-v3.2",
      name: "DeepSeek V3.2 (Thinking in Tool-Use)",
      contextWindow: 128000,
      supportsTools: true,
      supportsImages: false,
    },
    {
      id: "deepseek-chat",
      name: "DeepSeek Chat",
      contextWindow: 64000,
      supportsTools: true,
      supportsImages: false,
    },
  ];

  constructor(apiKey?: string) {
    super();

    // Try to get API key from parameter, then environment variable
    this.apiKey = apiKey || getApiKeyOrEnv("deepseek", "DEEPSEEK_API_KEY") || "";

    if (!this.apiKey) {
      throw new Error(
        "DeepSeek API key not found. Set DEEPSEEK_API_KEY environment variable or provide it in the constructor."
      );
    }
  }

  get id(): string {
    return "deepseek";
  }

  get name(): string {
    return "DeepSeek";
  }

  get models(): ModelDescriptor[] {
    return this.modelDescriptors;
  }

  /**
   * Main chat method that implements streaming chat completions
   * Returns an AsyncGenerator that yields deltas as they arrive
   */
  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const { tools, temperature = 0.7, maxTokens, enableThinking, retainChainOfThought } = options;

    // Convert our Message format to DeepSeek format
    const deepseekMessages: DeepSeekMessage[] = messages.map((msg) => {
      const deepseekMsg: DeepSeekMessage = {
        role: msg.role,
        content: msg.content,
      };

      // Convert tool calls
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        deepseekMsg.tool_calls = msg.toolCalls.map((tc) => ({
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
        deepseekMsg.tool_call_id = msg.toolCallId;
      }

      return deepseekMsg;
    });

    // Convert tools to DeepSeek format
    let deepseekTools: DeepSeekTool[] | undefined;
    if (tools && tools.length > 0) {
      deepseekTools = tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.modelDescriptors[0]?.id || "deepseek-v3", // Default to deepseek-v3
      messages: deepseekMessages,
      stream: true,
      temperature,
    };

    // Add optional parameters
    if (maxTokens) {
      requestBody.max_tokens = maxTokens;
    }

    if (deepseekTools) {
      requestBody.tools = deepseekTools;
    }

    // DeepSeek V3.2 "Thinking in Tool-Use" mode
    if (enableThinking || retainChainOfThought) {
      requestBody.retain_chain_of_thought = true;
    }

    // Make streaming request
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`
        );
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith(":")) {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6).trim();

            // Stream done
            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const parsed: DeepSeekResponse = JSON.parse(data);
              const choice = parsed.choices[0];

              if (!choice) {
                continue;
              }

              // Yield content delta
              if (choice.delta.content) {
                yield {
                  type: "content",
                  content: choice.delta.content,
                };
              }

              // Yield tool call delta
              if (choice.delta.tool_calls && choice.delta.tool_calls.length > 0) {
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
            } catch (parseError) {
              console.error("Failed to parse SSE data:", data, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("DeepSeek API request failed:", error);
      throw error;
    }
  }

  /**
   * Count tokens in messages
   * For Phase 1: Simple estimation (4 chars ≈ 1 token for English text)
   * Phase 3 will implement accurate tokenizer integration
   */
  async countTokens(messages: Message[]): Promise<number> {
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
    return Math.ceil(totalChars / 4);
  }

  supportsMCP(): boolean {
    return false; // DeepSeek doesn't support MCP protocol natively
  }

  supportsTools(): boolean {
    return true; // All DeepSeek models support tool calling
  }

  maxContextWindow(): number {
    // Return the maximum context window across all models
    return Math.max(...this.modelDescriptors.map((m) => m.contextWindow));
  }
}

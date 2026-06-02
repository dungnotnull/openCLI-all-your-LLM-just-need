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

import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";

interface GrokMessage {
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

interface GrokTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface GrokRequest {
  model: string;
  messages: GrokMessage[];
  tools?: GrokTool[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream: boolean;
}

interface GrokStreamingResponse {
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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.x.ai";

  private readonly modelDescriptors: ModelDescriptor[] = [
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

  constructor(apiKey?: string) {
    super();

    this.apiKey = apiKey || getApiKeyOrEnv("grok", "XAI_API_KEY") || "";

    if (!this.apiKey) {
      throw new Error(
        "xAI API key not found. Set XAI_API_KEY environment variable or provide it in the constructor."
      );
    }
  }

  get id(): string {
    return "grok";
  }

  get name(): string {
    return "Grok (xAI)";
  }

  get models(): ModelDescriptor[] {
    return this.modelDescriptors;
  }

  /**
   * Main chat method with streaming support
   */
  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const { tools, temperature = 0.7, maxTokens = 4096 } = options;

    // Convert to Grok format (OpenAI-compatible)
    const grokMessages: GrokMessage[] = messages.map((msg) => {
      const grokMsg: GrokMessage = {
        role: msg.role as "system" | "user" | "assistant" | "tool",
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
    const request: GrokRequest = {
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as GrokStreamingResponse;

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
          } catch (e) {
            // Skip malformed SSE lines
            continue;
          }
        }
      }
    } catch (error) {
      throw new Error(`Grok API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Count tokens for Grok models
   */
  async countTokens(messages: Message[]): Promise<number> {
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

  supportsMCP(): boolean {
    return true;
  }
}

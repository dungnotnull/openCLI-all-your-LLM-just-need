/**
 * Gemini (Google) API Provider Implementation
 *
 * Supports:
 * - Gemini 2.0 Flash (1M context)
 * - Gemini 2.0 Flash Thinking (1M context)
 * - Gemini 1.5 Pro (1M context)
 * - Gemini 1.5 Flash (1M context)
 *
 * API: https://generativelanguage.googleapis.com
 * Tool-calling: Google function calling format
 */

import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
import { getApiKeyOrEnv } from "../utils/secure-storage.js";

interface GeminiContent {
  role?: string;
  parts: Array<
    | { text: string }
    | { function_call: { name: string; args: Record<string, unknown> } }
    | { function_response: { name: string; response: Record<string, unknown> } }
    | { inline_data: { mime_type: string; data: string } }
  >;
}

interface GeminiTool {
  function_declarations: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

interface GeminiRequest {
  contents: GeminiContent[];
  tools?: GeminiTool[];
  generation_config?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiStreamingResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        function_call?: { name: string; args: Record<string, unknown> };
        function_response?: { name: string; response: Record<string, unknown> };
      }>;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://generativelanguage.googleapis.com";

  private readonly modelDescriptors: ModelDescriptor[] = [
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash (Experimental)",
      contextWindow: 1000000,
      supportsTools: true,
      supportsImages: true,
    },
    {
      id: "gemini-2.0-flash-thinking-exp",
      name: "Gemini 2.0 Flash Thinking",
      contextWindow: 1000000,
      supportsTools: true,
      supportsImages: false,
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      contextWindow: 1000000,
      supportsTools: true,
      supportsImages: true,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      contextWindow: 1000000,
      supportsTools: true,
      supportsImages: true,
    },
  ];

  constructor(apiKey?: string) {
    super();

    this.apiKey = apiKey || getApiKeyOrEnv("gemini", "GOOGLE_API_KEY") || "";

    if (!this.apiKey) {
      throw new Error(
        "Google API key not found. Set GOOGLE_API_KEY environment variable or provide it in the constructor."
      );
    }
  }

  get id(): string {
    return "gemini";
  }

  get name(): string {
    return "Gemini (Google)";
  }

  get models(): ModelDescriptor[] {
    return this.modelDescriptors;
  }

  /**
   * Main chat method with streaming support
   */
  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const { tools, temperature = 0.7, maxTokens = 8192 } = options;

    // Convert to Gemini format
    const geminiContents = this.convertToGeminiFormat(messages);

    // Build generation config
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    // Build request
    const request: GeminiRequest = {
      contents: geminiContents,
      generation_config: generationConfig,
    };

    // Add tools if present
    if (tools && tools.length > 0) {
      (request as any).tools = [{
        function_declarations: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        })),
      }];
    }

    const model = options.model || this.models[0]?.id || "gemini-2.0-flash-exp";

    try {
      const response = await fetch(
        `${this.baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as GeminiStreamingResponse;

            if (parsed.candidates && parsed.candidates[0]) {
              const candidate = parsed.candidates[0];
              const parts = candidate.content.parts;

              for (const part of parts) {
                // Yield text content
                if (part.text) {
                  yield {
                    type: "content",
                    content: part.text,
                  };
                }

                // Handle function calls
                if (part.function_call) {
                  yield {
                    type: "tool_call_start",
                    toolCallId: `call_${Date.now()}`,
                    toolName: part.function_call.name,
                  };

                  yield {
                    type: "tool_call_delta",
                    toolInput: JSON.stringify(part.function_call.args),
                  };
                }

                // Yield usage info
                if (parsed.usageMetadata) {
                  yield {
                    type: "usage",
                    inputTokens: parsed.usageMetadata.promptTokenCount,
                    outputTokens: parsed.usageMetadata.candidatesTokenCount,
                  };
                }
              }
            }
          } catch (e) {
            // Skip malformed SSE lines
            continue;
          }
        }
      }
    } catch (error) {
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert messages to Gemini format
   */
  private convertToGeminiFormat(messages: Message[]): GeminiContent[] {
    const geminiContents: GeminiContent[] = [];

    for (const message of messages) {
      const parts: GeminiContent["parts"] = [{ text: message.content }];

      // Handle tool calls in assistant messages
      if (message.toolCalls && message.toolCalls.length > 0) {
        parts.splice(0, 1); // Remove default text part

        for (const toolCall of message.toolCalls) {
          parts.push({
            function_call: {
              name: toolCall.name,
              args: toolCall.input,
            },
          });
        }
      }

      // Handle tool result messages
      if (message.role === "tool") {
        parts.splice(0, 1);
        parts.push({
          function_response: {
            name: message.toolCallId || "",
            response: JSON.parse(message.content || "{}"),
          },
        });
      }

      // Handle images
      if (message.images && message.images.length > 0) {
        for (const image of message.images) {
          parts.push({
            inline_data: {
              mime_type: image.mediaType || "image/png",
              data: image.data,
            },
          });
        }
      }

      // Map roles to Gemini format
      let geminiRole: string | undefined = message.role;
      if (message.role === "assistant") {
        geminiRole = "model";
      } else if (message.role === "system") {
        geminiRole = "user"; // Gemini treats system as user instruction
      }

      geminiContents.push({
        role: geminiRole,
        parts,
      });
    }

    return geminiContents;
  }

  /**
   * Count tokens for Gemini models
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

    // Gemini uses ~4 characters per token
    return Math.ceil(totalChars / 4);
  }

  supportsMCP(): boolean {
    return true;
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QwenProvider } from "../../../src/providers/qwen.js";
import type { Message, ToolSchema } from "../../../src/types/index.js";
import { qwenMockChunks } from "../utils/sse-mock.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("QwenProvider", () => {
  let provider: QwenProvider;

  beforeEach(() => {
    // Use a dummy API key for testing
    provider = new QwenProvider("test-api-key");
    mockFetch.mockReset();
  });

  describe("Provider properties", () => {
    it("should have correct provider ID", () => {
      expect(provider.id).toBe("qwen");
    });

    it("should have correct provider name", () => {
      expect(provider.name).toBe("Qwen");
    });

    it("should have models defined", () => {
      const models = provider.models;
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe("qwen3-coder");
      expect(models[1].id).toBe("qwen3-coder-next");
    });

    it("should have correct context windows", () => {
      const models = provider.models;
      expect(models[0].contextWindow).toBe(256000);
      expect(models[1].contextWindow).toBe(256000);
    });

    it("should support tools", () => {
      expect(provider.supportsTools()).toBe(true);
    });

    it("should not support MCP", () => {
      expect(provider.supportsMCP()).toBe(false);
    });

    it("should return max context window", () => {
      expect(provider.maxContextWindow()).toBe(256000);
    });
  });

  describe("Token counting", () => {
    it("should count tokens from simple message", async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Write a function to sort an array.",
        },
      ];

      const tokens = await provider.countTokens(messages);
      expect(tokens).toBeGreaterThan(0);
      // ~32 chars, estimated ~8 tokens
      expect(tokens).toBeLessThan(20);
    });

    it("should count tokens with tool calls", async () => {
      const messages: Message[] = [
        {
          role: "assistant",
          content: "Let me search for that information.",
          toolCalls: [
            {
              id: "call_qwen_123",
              name: "web_search",
              input: { query: "TypeScript generics tutorial" },
            },
          ],
        },
      ];

      const tokens = await provider.countTokens(messages);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe("API key handling", () => {
    it("should throw error if no API key provided", () => {
      const originalEnv = process.env.DASHSCOPE_API_KEY;

      try {
        delete process.env.DASHSCOPE_API_KEY;
        expect(() => new QwenProvider()).toThrow("Qwen API key not found");
      } finally {
        if (originalEnv) {
          process.env.DASHSCOPE_API_KEY = originalEnv;
        }
      }
    });

    it("should use provided API key", () => {
      const providerWithKey = new QwenProvider("my-qwen-key");
      expect(providerWithKey).toBeDefined();
    });
  });

  describe("Chat without tools (mocked)", () => {
    it("should stream basic chat response", async () => {
      const messages: Message[] = [
        { role: "user", content: "Explain async/await in JavaScript" },
      ];

      // Mock successful SSE response
      const chunks = qwenMockChunks.basic(
        "Async/await is a syntax for handling Promises in a more synchronous way."
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(chunks),
      });

      const deltas = [];
      for await (const delta of provider.chat(messages, {})) {
        deltas.push(delta);
      }

      // Should have content and done deltas
      expect(deltas.length).toBeGreaterThanOrEqual(2);
      expect(deltas[0].type).toBe("content");
      expect(deltas[0].content).toContain("Async/await");
      expect(deltas[deltas.length - 1].type).toBe("done");

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
            "X-DashScope-SSE": "enable",
          }),
        })
      );
    });

    it("should handle streaming response accumulation", async () => {
      const messages: Message[] = [
        { role: "user", content: "Count to 5" },
      ];

      // Mock streaming chunks
      const chunks = [
        qwenMockChunks.basic("1, ")[0],
        qwenMockChunks.basic("2, ")[0],
        qwenMockChunks.basic("3, ")[0],
        qwenMockChunks.basic("4, ")[0],
        qwenMockChunks.basic("5")[0],
        qwenMockChunks.basic("")[1], // Empty data = end
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(chunks),
      });

      const deltas = [];
      let accumulatedContent = "";

      for await (const delta of provider.chat(messages, {})) {
        deltas.push(delta);
        if (delta.type === "content" && delta.content) {
          accumulatedContent += delta.content;
        }
      }

      // Should accumulate all chunks
      expect(accumulatedContent).toBe("1, 2, 3, 4, 5");
      expect(deltas.filter((d) => d.type === "done").length).toBeGreaterThanOrEqual(1);
    });

    it("should send correct request body format", async () => {
      const messages: Message[] = [
        { role: "system", content: "You are a coding assistant" },
        { role: "user", content: "Help me debug" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(qwenMockChunks.basic("I'll help")),
      });

      await consumeStream(provider.chat(messages, { temperature: 0.3 }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // Qwen uses nested input/parameters structure
      expect(body.model).toBe("qwen3-coder");
      expect(body.input).toBeDefined();
      expect(body.input.messages).toEqual([
        { role: "system", content: "You are a coding assistant" },
        { role: "user", content: "Help me debug" },
      ]);
      expect(body.parameters).toBeDefined();
      expect(body.parameters.result_format).toBe("message");
      expect(body.parameters.temperature).toBe(0.3);
    });
  });

  describe("Chat with tools (mocked)", () => {
    it("should handle tool calls in response", async () => {
      const messages: Message[] = [
        { role: "user", content: "Find files matching *.ts" },
      ];

      const tools: ToolSchema[] = [
        {
          name: "find_files",
          description: "Find files matching a pattern",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              path: { type: "string" },
            },
            required: ["pattern"],
          },
        },
      ];

      // Mock tool call response
      const chunks = qwenMockChunks.withToolCall("find_files", {
        pattern: "*.ts",
        path: "./src",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(chunks),
      });

      const deltas = [];
      for await (const delta of provider.chat(messages, { tools })) {
        deltas.push(delta);
      }

      // Should have tool call delta
      const toolCallDelta = deltas.find((d) => d.type === "tool_call");
      expect(toolCallDelta).toBeDefined();
      expect(toolCallDelta!.toolCall).toBeDefined();
      expect(toolCallDelta!.toolCall!.name).toBe("find_files");
      expect(toolCallDelta!.toolCall!.input).toEqual({
        pattern: "*.ts",
        path: "./src",
      });
    });

    it("should send tools in correct DashScope format", async () => {
      const messages: Message[] = [
        { role: "user", content: "Execute git status" },
      ];

      const tools: ToolSchema[] = [
        {
          name: "bash_execute",
          description: "Execute bash command",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string" },
            },
            required: ["command"],
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(qwenMockChunks.basic("Executed")),
      });

      await consumeStream(provider.chat(messages, { tools }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.parameters.tools).toEqual([
        {
          type: "function",
          function: {
            name: "bash_execute",
            description: "Execute bash command",
            parameters: {
              type: "object",
              properties: {
                command: { type: "string" },
              },
              required: ["command"],
            },
          },
        },
      ]);
    });
  });

  describe("Qwen-specific features", () => {
    it("should handle enable_thinking flag", async () => {
      const messages: Message[] = [
        { role: "user", content: "Solve this step by step" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(qwenMockChunks.basic("Thinking...")),
      });

      await consumeStream(
        provider.chat(messages, {
          enableThinking: true,
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.parameters.enable_thinking).toBe(true);
    });

    it("should not enable thinking by default", async () => {
      const messages: Message[] = [
        { role: "user", content: "Quick answer" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(qwenMockChunks.basic("Answer")),
      });

      await consumeStream(provider.chat(messages, {}));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.parameters.enable_thinking).toBeUndefined();
    });

    it("should handle finish_reason from stream", async () => {
      const messages: Message[] = [
        { role: "user", content: "Complete this" },
      ];

      // Create chunks with finish_reason
      const finishChunk = {
        data: JSON.stringify({
          output: {
            choices: [
              {
                index: 0,
                delta: { content: "Done" },
                finish_reason: "stop",
              },
            ],
          },
          request_id: "req-finish",
        }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks([finishChunk]),
      });

      const deltas = [];
      for await (const delta of provider.chat(messages, {})) {
        deltas.push(delta);
      }

      // Should end with done type when finish_reason is present
      expect(deltas[deltas.length - 1].type).toBe("done");
    });
  });

  describe("Error handling", () => {
    it("should handle API error response", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        body: null,
        text: async () => "Invalid request format",
      });

      await expect(provider.chat(messages, {}).next()).rejects.toThrow(
        "Qwen API error: 400 Bad Request"
      );
    });

    it("should handle network errors", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockRejectedValueOnce(new Error("Connection timeout"));

      await expect(provider.chat(messages, {}).next()).rejects.toThrow("Connection timeout");
    });

    it("should handle null response body", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      await expect(provider.chat(messages, {}).next()).rejects.toThrow("Response body is null");
    });

    it("should handle malformed SSE data gracefully", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      // Create a stream with invalid JSON
      const malformedStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: {invalid json\n\n"));
          controller.enqueue(encoder.encode("data: \n\n")); // Empty data = end
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: malformedStream,
      });

      // Should not throw, just skip invalid chunks
      const deltas = [];
      for await (const delta of provider.chat(messages, {})) {
        deltas.push(delta);
      }

      expect(deltas[deltas.length - 1].type).toBe("done");
    });
  });
});

// Helper functions
function createMockStreamFromChunks(chunks: any[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    start(controller) {
      const enqueueNext = () => {
        if (index >= chunks.length) {
          controller.close();
          return;
        }

        const chunk = chunks[index];
        // chunk.data is already the JSON string or empty string
        const dataContent = chunk.data === "" || chunk.data === "[DONE]" ? chunk.data : chunk.data;
        controller.enqueue(encoder.encode(`data: ${dataContent}\n\n`));
        index++;

        setTimeout(enqueueNext, 5);
      };

      enqueueNext();
    },
  });
}

async function consumeStream(generator: AsyncGenerator<any>) {
  for await (const _ of generator) {
    // Consume all chunks
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeepSeekProvider } from "../../../src/providers/deepseek.js";
import type { Message, ToolSchema } from "../../../src/types/index.js";
import { deepSeekMockChunks } from "../utils/sse-mock.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("DeepSeekProvider", () => {
  let provider: DeepSeekProvider;

  beforeEach(() => {
    // Use a dummy API key for testing
    provider = new DeepSeekProvider("test-api-key");
    mockFetch.mockReset();
  });

  describe("Provider properties", () => {
    it("should have correct provider ID", () => {
      expect(provider.id).toBe("deepseek");
    });

    it("should have correct provider name", () => {
      expect(provider.name).toBe("DeepSeek");
    });

    it("should have models defined", () => {
      const models = provider.models;
      expect(models).toHaveLength(3);
      expect(models[0].id).toBe("deepseek-v3");
      expect(models[1].id).toBe("deepseek-v3.2");
      expect(models[2].id).toBe("deepseek-chat");
    });

    it("should have correct context windows", () => {
      const models = provider.models;
      expect(models[0].contextWindow).toBe(128000);
      expect(models[1].contextWindow).toBe(128000);
      expect(models[2].contextWindow).toBe(64000);
    });

    it("should support tools", () => {
      expect(provider.supportsTools()).toBe(true);
    });

    it("should not support MCP", () => {
      expect(provider.supportsMCP()).toBe(false);
    });

    it("should return max context window", () => {
      expect(provider.maxContextWindow()).toBe(128000);
    });
  });

  describe("Token counting", () => {
    it("should count tokens from simple message", async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Hello, world!",
        },
      ];

      const tokens = await provider.countTokens(messages);
      expect(tokens).toBeGreaterThan(0);
      // "Hello, world!" is 13 chars, estimated ~4 tokens
      expect(tokens).toBeLessThan(10);
    });

    it("should count tokens from multiple messages", async () => {
      const messages: Message[] = [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "What is the capital of France?",
        },
        {
          role: "assistant",
          content: "The capital of France is Paris.",
        },
      ];

      const tokens = await provider.countTokens(messages);
      expect(tokens).toBeGreaterThan(0);
      // Should have more tokens than a single message
      expect(tokens).toBeGreaterThan(10);
    });

    it("should count tokens with tool calls", async () => {
      const messages: Message[] = [
        {
          role: "assistant",
          content: "Let me search for that.",
          toolCalls: [
            {
              id: "call_123",
              name: "web_search",
              input: { query: "Paris capital France" },
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
      // Save original env
      const originalEnv = process.env.DEEPSEEK_API_KEY;

      try {
        // Clear env
        delete process.env.DEEPSEEK_API_KEY;

        expect(() => new DeepSeekProvider()).toThrow("DeepSeek API key not found");
      } finally {
        // Restore env
        if (originalEnv) {
          process.env.DEEPSEEK_API_KEY = originalEnv;
        }
      }
    });

    it("should use provided API key", () => {
      const providerWithKey = new DeepSeekProvider("my-key");
      expect(providerWithKey).toBeDefined();
    });
  });

  describe("Chat without tools (mocked)", () => {
    it("should stream basic chat response", async () => {
      const messages: Message[] = [
        { role: "user", content: "Hello, how are you?" },
      ];

      // Mock successful SSE response
      const chunks = deepSeekMockChunks.basic("I'm doing well, thanks!");
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
      expect(deltas[0].content).toBe("I'm doing well, thanks!");
      expect(deltas[deltas.length - 1].type).toBe("done");

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.deepseek.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle streaming response accumulation", async () => {
      const messages: Message[] = [
        { role: "user", content: "Tell me a story" },
      ];

      // Mock streaming chunks
      const chunks = [
        deepSeekMockChunks.basic("Once upon ")[0],
        deepSeekMockChunks.basic("a time, ")[0],
        deepSeekMockChunks.basic("there was ")[0],
        deepSeekMockChunks.basic("a brave coder.")[0],
        deepSeekMockChunks.basic("")[1], // [DONE]
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
      expect(accumulatedContent).toBe("Once upon a time, there was a brave coder.");
      expect(deltas.filter((d) => d.type === "done").length).toBe(1);
    });

    it("should use custom temperature and maxTokens", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(deepSeekMockChunks.basic("Response")),
      });

      await consumeStream(provider.chat(messages, {
        temperature: 0.5,
        maxTokens: 100,
      }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(100);
    });
  });

  describe("Chat with tools (mocked)", () => {
    it("should handle tool calls in response", async () => {
      const messages: Message[] = [
        { role: "user", content: "What's the weather like?" },
      ];

      const tools: ToolSchema[] = [
        {
          name: "get_weather",
          description: "Get current weather",
          inputSchema: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        },
      ];

      // Mock tool call response
      const chunks = deepSeekMockChunks.withToolCall("get_weather", {
        location: "San Francisco",
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
      expect(toolCallDelta!.toolCall!.name).toBe("get_weather");
      expect(toolCallDelta!.toolCall!.input).toEqual({ location: "San Francisco" });
    });

    it("should send tools in correct format to API", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      const tools: ToolSchema[] = [
        {
          name: "search",
          description: "Search the web",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(deepSeekMockChunks.basic("Done")),
      });

      await consumeStream(provider.chat(messages, { tools }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.tools).toEqual([
        {
          type: "function",
          function: {
            name: "search",
            description: "Search the web",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
            },
          },
        },
      ]);
    });

    it("should handle thinking mode with retain_chain_of_thought", async () => {
      const messages: Message[] = [
        { role: "user", content: "Solve this problem" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: createMockStreamFromChunks(deepSeekMockChunks.basic("Solution")),
      });

      await consumeStream(provider.chat(messages, {
        enableThinking: true,
        retainChainOfThought: true,
      }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.retain_chain_of_thought).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle missing API key error", () => {
      const originalEnv = process.env.DEEPSEEK_API_KEY;

      try {
        delete process.env.DEEPSEEK_API_KEY;
        expect(() => new DeepSeekProvider()).toThrow("DeepSeek API key not found");
      } finally {
        if (originalEnv) {
          process.env.DEEPSEEK_API_KEY = originalEnv;
        }
      }
    });

    it("should handle API error response", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        body: null,
        text: async () => "Invalid API key",
      });

      await expect(provider.chat(messages, {}).next()).rejects.toThrow(
        "DeepSeek API error: 401 Unauthorized"
      );
    });

    it("should handle network errors", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(provider.chat(messages, {}).next()).rejects.toThrow("Network error");
    });

    it("should handle malformed SSE data gracefully", async () => {
      const messages: Message[] = [
        { role: "user", content: "Test" },
      ];

      // Create a stream with invalid JSON
      const malformedStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: invalid json\n\n"));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
        // chunk.data is already the JSON string or [DONE]
        const dataContent = chunk.data === "[DONE]" ? "[DONE]" : chunk.data;
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

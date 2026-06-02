/**
 * Mock utilities for Server-Sent Events (SSE) streaming responses
 * Used to simulate API responses without making real HTTP calls
 */

export interface SSEChunk {
  data: string;
  event?: string;
}

/**
 * Create a mock ReadableStream that yields SSE chunks
 */
export function createMockSSEStream(chunks: SSEChunk[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  let index = 0;
  return new ReadableStream({
    start(controller) {
      // Function to enqueue chunks with delay to simulate streaming
      const enqueueNext = () => {
        if (index >= chunks.length) {
          controller.close();
          return;
        }

        const chunk = chunks[index];
        let line = `data: ${chunk.data}\n\n`;

        if (chunk.event) {
          line = `event: ${chunk.event}\n${line}`;
        }

        controller.enqueue(encoder.encode(line));
        index++;

        // Simulate network delay
        setTimeout(enqueueNext, 10);
      };

      enqueueNext();
    },
  });
}

/**
 * Create a mock fetch function that returns SSE responses
 */
export function createMockFetch(responseStream: ReadableStream<Uint8Array>): typeof fetch {
  return async () => {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      body: responseStream,
      headers: new Headers(),
      json: async () => ({}),
      text: async () => "",
    } as Response;
  };
}

/**
 * DeepSeek-specific SSE chunks for testing
 */
export const deepSeekMockChunks = {
  basic: (content: string): SSEChunk[] => [
    {
      data: JSON.stringify({
        id: "chatcmpl-123",
        object: "chat.completion.chunk",
        created: 1677652288,
        model: "deepseek-v3",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content },
            finish_reason: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    },
    { data: "[DONE]" },
  ],

  withToolCall: (toolName: string, toolArgs: Record<string, unknown>): SSEChunk[] => [
    {
      data: JSON.stringify({
        id: "chatcmpl-456",
        object: "chat.completion.chunk",
        created: 1677652288,
        model: "deepseek-v3",
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_abc123",
                  type: "function",
                  function: {
                    name: toolName,
                    arguments: JSON.stringify(toolArgs),
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
      }),
    },
    { data: "[DONE]" },
  ],
};

/**
 * Qwen-specific SSE chunks for testing
 */
export const qwenMockChunks = {
  basic: (content: string): SSEChunk[] => [
    {
      data: JSON.stringify({
        output: {
          choices: [
            {
              index: 0,
              delta: { role: "assistant", content },
              finish_reason: "null",
            },
          ],
        },
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        request_id: "req-123",
      }),
    },
    { data: "" }, // DashScope sends empty data to signal end
  ],

  withToolCall: (toolName: string, toolArgs: Record<string, unknown>): SSEChunk[] => [
    {
      data: JSON.stringify({
        output: {
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: "call_xyz789",
                    type: "function",
                    function: {
                      name: toolName,
                      arguments: JSON.stringify(toolArgs),
                    },
                  },
                ],
              },
              finish_reason: "null",
            },
          ],
        },
        usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
        request_id: "req-456",
      }),
    },
    { data: "" },
  ],
};

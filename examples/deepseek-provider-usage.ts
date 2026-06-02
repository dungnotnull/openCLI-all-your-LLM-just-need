/**
 * DeepSeekProvider Usage Example
 *
 * This example demonstrates how to use the DeepSeekProvider
 * for chat completions with tool calling support.
 */

import { DeepSeekProvider } from "../src/providers/deepseek.js";
import type { Message } from "../src/types/index.js";

async function main() {
  // Initialize the provider (reads from DEEPSEEK_API_KEY env var)
  const provider = new DeepSeekProvider();

  console.log(`Provider: ${provider.name} (${provider.id})`);
  console.log(`Available models:`, provider.models.map((m) => m.id));
  console.log(`Max context window: ${provider.maxContextWindow()} tokens`);

  // Example messages
  const messages: Message[] = [
    {
      role: "system",
      content: "You are a helpful coding assistant.",
    },
    {
      role: "user",
      content: "What is TypeScript?",
    },
  ];

  // Count tokens before sending
  const tokenCount = await provider.countTokens(messages);
  console.log(`Estimated tokens: ${tokenCount}`);

  // Example with tool calling
  console.log("\n--- Streaming Chat Example ---");
  try {
    const response = provider.chat(messages, {
      temperature: 0.7,
      enableThinking: false,
    });

    let fullResponse = "";
    for await (const delta of response) {
      if (delta.type === "content" && delta.content) {
        process.stdout.write(delta.content);
        fullResponse += delta.content;
      } else if (delta.type === "tool_call") {
        console.log("\n[Tool Call]", delta.toolCall);
      } else if (delta.type === "done") {
        console.log("\n[Stream complete]");
      }
    }

    console.log(`\nTotal response length: ${fullResponse.length} chars`);
  } catch (error) {
    console.error("Chat failed:", error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as deepSeekExample };

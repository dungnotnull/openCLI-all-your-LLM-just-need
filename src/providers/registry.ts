// Re-export the ModelProvider interface for convenience
export {
  ModelProvider,
  type ModelDescriptor,
  type ChatOptions,
  type Delta,
  type ChatResponse,
} from "../types/index.js";

// Export individual providers
export { DeepSeekProvider } from "./deepseek.js";
export { QwenProvider } from "./qwen.js";
export { MinimaxProvider } from "./minimax.js";
export { GLMProvider } from "./glm.js";
export { KimiProvider } from "./kimi.js";
export { DevstralProvider } from "./devstral.js";
export { OllamaProvider } from "./ollama.js";
export { ClaudeProvider } from "./claude.js";
export { GPTProvider } from "./gpt.js";
export { GeminiProvider } from "./gemini.js";
export { GrokProvider } from "./grok.js";

// Import the type for use in the registry signature
import type { ModelProvider as ModelProviderType } from "../types/index.js";

/**
 * Provider Registry
 *
 * Maps provider IDs to their implementation classes
 */
export const providerRegistry: Record<string, new (apiKey?: string) => ModelProviderType> = {
  deepseek: (await import("./deepseek.js")).DeepSeekProvider,
  qwen: (await import("./qwen.js")).QwenProvider,
  minimax: (await import("./minimax.js")).MinimaxProvider,
  glm: (await import("./glm.js")).GLMProvider,
  kimi: (await import("./kimi.js")).KimiProvider,
  devstral: (await import("./devstral.js")).DevstralProvider,
  ollama: (await import("./ollama.js")).OllamaProvider,
  claude: (await import("./claude.js")).ClaudeProvider,
  gpt: (await import("./gpt.js")).GPTProvider,
  gemini: (await import("./gemini.js")).GeminiProvider,
  grok: (await import("./grok.js")).GrokProvider,
  // OpenAI-compat requires custom constructor, not in auto-registry
};

/**
 * Get a provider instance by ID
 */
export async function getProvider(
  providerId: string,
  apiKey?: string
): Promise<ModelProviderType | null> {
  const ProviderClass = providerRegistry[providerId];
  if (!ProviderClass) {
    return null;
  }

  return new ProviderClass(apiKey);
}

/**
 * List all available provider IDs
 */
export function listProviders(): string[] {
  return Object.keys(providerRegistry);
}

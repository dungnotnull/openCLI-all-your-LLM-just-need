export { ModelProvider, type ModelDescriptor, type ChatOptions, type Delta, type ChatResponse, } from "../types/index.js";
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
import type { ModelProvider as ModelProviderType } from "../types/index.js";
/**
 * Provider Registry
 *
 * Maps provider IDs to their implementation classes
 */
export declare const providerRegistry: Record<string, new (apiKey?: string) => ModelProviderType>;
/**
 * Get a provider instance by ID
 */
export declare function getProvider(providerId: string, apiKey?: string): Promise<ModelProviderType | null>;
/**
 * List all available provider IDs
 */
export declare function listProviders(): string[];
//# sourceMappingURL=registry.d.ts.map
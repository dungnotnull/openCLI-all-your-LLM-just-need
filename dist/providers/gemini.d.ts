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
export declare class GeminiProvider extends ModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly modelDescriptors;
    constructor(apiKey?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    /**
     * Main chat method with streaming support
     */
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    /**
     * Convert messages to Gemini format
     */
    private convertToGeminiFormat;
    /**
     * Count tokens for Gemini models
     */
    countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
}
//# sourceMappingURL=gemini.d.ts.map
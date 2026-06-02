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
export declare class GrokProvider extends ModelProvider {
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
     * Count tokens for Grok models
     */
    countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
}
//# sourceMappingURL=grok.d.ts.map
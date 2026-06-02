/**
 * GPT (OpenAI) API Provider Implementation
 *
 * Supports:
 * - GPT-4o (128K context, multimodal)
 * - GPT-4o mini (128K context)
 * - GPT-4 Turbo (128K context)
 * - GPT-3.5 Turbo (16K context)
 *
 * API: https://api.openai.com
 * Tool-calling: OpenAI function calling format
 */
import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
export declare class GPTProvider extends ModelProvider {
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
     * Count tokens using tiktoken
     * For OpenAI models, we can use tiktoken for accurate counting
     */
    countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
}
//# sourceMappingURL=gpt.d.ts.map
import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
export declare class QwenProvider extends ModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly modelDescriptors;
    constructor(apiKey?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    /**
     * Main chat method that implements streaming chat completions
     * Returns an AsyncGenerator that yields deltas as they arrive
     */
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    /**
     * Count tokens in messages
     * For Phase 1: Simple estimation (4 chars ≈ 1 token for English text)
     * Phase 3 will implement accurate tokenizer integration
     */
    countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
    supportsTools(): boolean;
    maxContextWindow(): number;
}
//# sourceMappingURL=qwen.d.ts.map
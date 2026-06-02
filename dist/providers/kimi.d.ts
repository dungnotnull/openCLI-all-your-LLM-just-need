import { ModelProvider, Message, Delta, ChatOptions, ModelDescriptor } from '../types/index.js';
export declare class KimiProvider extends ModelProvider {
    private readonly apiKey;
    private readonly maxRetries;
    constructor(apiKey?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    private sleep;
    private fetchWithRetry;
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    countTokens(messages: Message[]): Promise<number>;
    maxContextWindow(): number;
}
//# sourceMappingURL=kimi.d.ts.map
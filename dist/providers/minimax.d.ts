import { ModelProvider, Message, Delta, ChatOptions, ModelDescriptor } from '../types/index.js';
export declare class MinimaxProvider extends ModelProvider {
    private readonly apiKey;
    constructor(apiKey?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    countTokens(messages: Message[]): Promise<number>;
    maxContextWindow(): number;
}
//# sourceMappingURL=minimax.d.ts.map
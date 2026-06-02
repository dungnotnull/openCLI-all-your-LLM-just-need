import { ModelProvider, Message, Delta, ChatOptions, ModelDescriptor } from '../types/index.js';
export declare class DevstralProvider extends ModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(apiKey?: string, baseUrl?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    countTokens(messages: Message[]): Promise<number>;
    maxContextWindow(): number;
}
//# sourceMappingURL=devstral.d.ts.map
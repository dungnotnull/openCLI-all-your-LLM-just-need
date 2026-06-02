import { ModelProvider, Message, Delta, ChatOptions, ModelDescriptor } from '../types/index.js';
export declare class OpenAICompatProvider extends ModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly defaultModel;
    constructor(apiKey: string, baseUrl: string, defaultModel: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    countTokens(messages: Message[]): Promise<number>;
    maxContextWindow(): number;
}
//# sourceMappingURL=openai-compat.d.ts.map
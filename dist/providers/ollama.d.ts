import { ModelProvider, Message, Delta, ChatOptions, ModelDescriptor } from '../types/index.js';
export declare class OllamaProvider extends ModelProvider {
    private readonly baseUrl;
    private availableModels;
    constructor(baseUrl?: string);
    get id(): string;
    get name(): string;
    get models(): ModelDescriptor[];
    detectModels(): Promise<ModelDescriptor[]>;
    private estimateContextWindow;
    private supportsToolsForModel;
    chat(messages: Message[], options?: ChatOptions): AsyncGenerator<Delta>;
    countTokens(messages: Message[]): Promise<number>;
    maxContextWindow(): number;
}
//# sourceMappingURL=ollama.d.ts.map
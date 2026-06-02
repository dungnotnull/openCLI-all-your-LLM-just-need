/**
 * Claude (Anthropic) API Provider Implementation
 *
 * Supports:
 * - Claude 3.5 Sonnet (200K context)
 * - Claude 3.5 Sonnet New (20241022)
 * - Claude 3 Opus (200K context)
 * - Claude 3 Haiku (200K context)
 *
 * API: https://api.anthropic.com
 * Tool-calling: Anthropic-compatible format with tool_use and tool_result content blocks
 */
import { ModelProvider, ModelDescriptor, Message, ChatOptions, Delta } from "../types/index.js";
export declare class ClaudeProvider extends ModelProvider {
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
     * Convert messages to Anthropic format
     */
    private convertToAnthropicFormat;
    /**
     * Count tokens using Anthropic's counting approach
     * Claude uses a different tokenizer than tiktoken
     */
    countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
}
//# sourceMappingURL=claude.d.ts.map
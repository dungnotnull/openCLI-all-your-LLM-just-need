/**
 * Token counting utilities
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */
/**
 * Count exact tokens for text using tiktoken (OpenAI-compatible providers)
 */
export declare function countTokensWithTiktoken(text: string): Promise<number>;
/**
 * Estimate tokens based on character count and provider ratio
 */
export declare function estimateTokens(text: string, providerId?: string): number;
/**
 * Count tokens for a specific provider
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */
export declare function countTokens(providerId: string, text: string): Promise<number>;
/**
 * Count tokens in a message array
 */
export declare function countMessageTokens(providerId: string, messages: Array<{
    role: string;
    content: string;
}>): Promise<number>;
//# sourceMappingURL=tokenizer.d.ts.map
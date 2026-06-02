/**
 * Token counting utilities
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */
// Lazy load tiktoken to avoid startup overhead
let tiktoken = null;
async function getTiktoken() {
    if (!tiktoken) {
        try {
            const module = await import('js-tiktoken');
            tiktoken = module.get_encoding('cl100k_base');
        }
        catch (error) {
            console.warn('tiktoken not available, using estimation');
            return null;
        }
    }
    return tiktoken;
}
/**
 * Count exact tokens for text using tiktoken (OpenAI-compatible providers)
 */
export async function countTokensWithTiktoken(text) {
    const encoder = await getTiktoken();
    if (!encoder) {
        return estimateTokens(text);
    }
    const tokens = encoder.encode(text);
    return tokens.length;
}
/**
 * Provider-specific character-to-token ratios
 * Based on empirical testing and documentation
 */
const PROVIDER_RATIOS = {
    deepseek: 1.3,
    qwen: 1.3,
    minimax: 1.5,
    glm: 1.3,
    kimi: 1.3,
    devstral: 1.3,
    ollama: 1.5,
    'openai-compat': 1.5,
};
/**
 * Estimate tokens based on character count and provider ratio
 */
export function estimateTokens(text, providerId = 'deepseek') {
    if (!text)
        return 0;
    const ratio = PROVIDER_RATIOS[providerId] || 1.4;
    return Math.ceil(text.length / ratio);
}
/**
 * Providers that use tiktoken-compatible encoding
 */
const TIKTOKEN_PROVIDERS = new Set([
    'deepseek', // OpenAI-compatible
    'kimi', // OpenAI-compatible
    'devstral', // Mistral uses similar encoding
    'openai-compat',
]);
/**
 * Count tokens for a specific provider
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */
export async function countTokens(providerId, text) {
    if (!text)
        return 0;
    // Use tiktoken for OpenAI-compatible providers
    if (TIKTOKEN_PROVIDERS.has(providerId)) {
        return await countTokensWithTiktoken(text);
    }
    // Use estimation for others
    return estimateTokens(text, providerId);
}
/**
 * Count tokens in a message array
 */
export async function countMessageTokens(providerId, messages) {
    let total = 0;
    for (const message of messages) {
        // Count role + content
        const roleTokens = await countTokens(providerId, message.role);
        const contentTokens = await countTokens(providerId, message.content);
        total += roleTokens + contentTokens + 4; // +4 for formatting overhead
    }
    return total;
}
//# sourceMappingURL=tokenizer.js.map
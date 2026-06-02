/**
 * CostTracker - API Call Cost Tracking for OpenCLI
 *
 * Phase 1 Implementation:
 * - Log-only version (no UI)
 * - Tracks per-session costs cumulatively
 * - Structured logging with timestamps
 * - Support for multiple provider pricing models
 *
 * Future Phases:
 * - Phase 2: Add all provider rates
 * - Phase 5: UI integration with Ink
 * - Phase 6: Budget enforcement
 */
/**
 * Cost rates per provider (per 1M tokens for consistency)
 * All rates in USD
 */
export interface CostRates {
    inputCostPerMillion: number;
    outputCostPerMillion: number;
}
/**
 * Cost tracking record for a single API call
 */
export interface CostRecord {
    timestamp: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
}
/**
 * Compression tracking record for a single compression event
 */
export interface CompressionRecord {
    timestamp: string;
    beforeTokens: number;
    afterTokens: number;
    reduction: number;
    reductionPercent: number;
    mode: string;
}
/**
 * CostTracker class - tracks API call costs per session
 *
 * Usage:
 * ```ts
 * const tracker = new CostTracker();
 * tracker.trackCall("deepseek", "deepseek-v3", 1000, 500);
 * const total = tracker.getSessionTotal(); // 0.00021 USD
 * ```
 */
export declare class CostTracker {
    private sessionTotal;
    private callCount;
    private compressionHistory;
    private totalTokensSaved;
    /**
     * Calculate cost for a single API call
     *
     * @param provider - Provider ID (e.g., "deepseek", "qwen")
     * @param inputTokens - Number of input tokens
     * @param outputTokens - Number of output tokens
     * @returns Cost in USD
     */
    private calculateCost;
    /**
     * Track an API call and log its cost
     *
     * @param provider - Provider ID (e.g., "deepseek", "qwen")
     * @param model - Model ID (e.g., "deepseek-v3", "qwen-turbo")
     * @param inputTokens - Number of input tokens used
     * @param outputTokens - Number of output tokens generated
     */
    trackCall(provider: string, model: string, inputTokens: number, outputTokens: number): void;
    /**
     * Log cost details in structured format
     *
     * Format:
     * [TIMESTAMP] Cost: $0.000021 | Provider: deepseek | Model: deepseek-v3 | Input: 1000 tokens | Output: 500 tokens
     *
     * @param provider - Provider ID
     * @param model - Model ID
     * @param inputTokens - Number of input tokens
     * @param outputTokens - Number of output tokens
     * @param cost - Cost in USD
     */
    logCost(provider: string, model: string, inputTokens: number, outputTokens: number, cost: number): void;
    /**
     * Get cumulative session cost
     *
     * @returns Total cost in USD for current session
     */
    getSessionTotal(): number;
    /**
     * Get number of calls tracked in current session
     *
     * @returns Number of API calls tracked
     */
    getCallCount(): number;
    /**
     * Track a compression event and log its metrics
     *
     * @param beforeTokens - Number of tokens before compression
     * @param afterTokens - Number of tokens after compression
     * @param mode - Compression mode used (sliding, semantic, adaptive)
     */
    trackCompression(beforeTokens: number, afterTokens: number, mode: string): void;
    /**
     * Log compression details in structured format
     *
     * Format:
     * [TIMESTAMP] Compression: sliding | Before: 10000 tokens | After: 5000 tokens | Saved: 5000 tokens (50.00%) | Total Saved: 15000 tokens
     *
     * @param record - Compression record to log
     */
    logCompression(record: CompressionRecord): void;
    /**
     * Get compression history for current session
     *
     * @returns Array of compression records, oldest first
     */
    getCompressionHistory(): CompressionRecord[];
    /**
     * Get total tokens saved through compression in current session
     *
     * @returns Total number of tokens saved across all compressions
     */
    getTotalTokensSaved(): number;
    /**
     * Get number of compression events tracked in current session
     *
     * @returns Number of compression events tracked
     */
    getCompressionCount(): number;
    /**
     * Reset session tracking
     *
     * Useful for:
     * - Starting a new session
     * - Testing
     * - Budget period reset
     */
    reset(): void;
    /**
     * Get cost rates for a provider
     *
     * @param provider - Provider ID
     * @returns Cost rates or undefined if provider not found
     */
    getRates(provider: string): CostRates | undefined;
    /**
     * Update cost rates for a provider
     *
     * Useful for:
     * - Price updates
     * - Custom pricing tiers
     * - Testing with different rates
     *
     * @param provider - Provider ID
     * @param rates - New cost rates
     */
    updateRates(provider: string, rates: CostRates): void;
}
/**
 * Singleton instance for global use
 * Can be imported and used across the application
 */
export declare const costTracker: CostTracker;
//# sourceMappingURL=tracker.d.ts.map
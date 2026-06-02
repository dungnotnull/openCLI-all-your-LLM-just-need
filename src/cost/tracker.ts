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

import { logger } from "../utils/logger.js";

/**
 * Cost rates per provider (per 1M tokens for consistency)
 * All rates in USD
 */
export interface CostRates {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
}

/**
 * Provider cost rate definitions
 * Updated: 2025-01-09
 *
 * Sources:
 * - DeepSeek: https://api.deepseek.com/pricing (Approximate, will update)
 * - Qwen: https://help.aliyun.com/zh/model-studio/ (Approximate, will update)
 */
const PROVIDER_RATES: Record<string, CostRates> = {
  // DeepSeek rates (approximate, per 1M tokens)
  deepseek: {
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
  },

  // Qwen rates (convert from $0.003/1K to $3/1M for consistency)
  qwen: {
    inputCostPerMillion: 3.0,
    outputCostPerMillion: 6.0,
  },

  // Placeholder for other providers (will be added in Phase 2)
  minimax: {
    inputCostPerMillion: 0.0,
    outputCostPerMillion: 0.0,
  },
  glm: {
    inputCostPerMillion: 0.0,
    outputCostPerMillion: 0.0,
  },
  kimi: {
    inputCostPerMillion: 0.0,
    outputCostPerMillion: 0.0,
  },
  ollama: {
    inputCostPerMillion: 0.0, // Local models are free
    outputCostPerMillion: 0.0,
  },
};

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
export class CostTracker {
  private sessionTotal: number = 0.0;
  private callCount: number = 0;
  private compressionHistory: CompressionRecord[] = [];
  private totalTokensSaved: number = 0;

  /**
   * Calculate cost for a single API call
   *
   * @param provider - Provider ID (e.g., "deepseek", "qwen")
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Cost in USD
   */
  private calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
    const rates = PROVIDER_RATES[provider];

    if (!rates) {
      logger.warn({ provider }, "Provider not found in cost rates, defaulting to zero cost");
      return 0.0;
    }

    // Calculate cost: (tokens / 1,000,000) * rate
    const inputCost = (inputTokens / 1_000_000) * rates.inputCostPerMillion;
    const outputCost = (outputTokens / 1_000_000) * rates.outputCostPerMillion;

    return inputCost + outputCost;
  }

  /**
   * Track an API call and log its cost
   *
   * @param provider - Provider ID (e.g., "deepseek", "qwen")
   * @param model - Model ID (e.g., "deepseek-v3", "qwen-turbo")
   * @param inputTokens - Number of input tokens used
   * @param outputTokens - Number of output tokens generated
   */
  trackCall(provider: string, model: string, inputTokens: number, outputTokens: number): void {
    const cost = this.calculateCost(provider, inputTokens, outputTokens);
    this.sessionTotal += cost;
    this.callCount++;

    this.logCost(provider, model, inputTokens, outputTokens, cost);
  }

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
  logCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ): void {
    const timestamp = new Date().toISOString();

    // Log in structured format for easy parsing
    logger.info({
      type: "api_call_cost",
      timestamp,
      provider,
      model,
      inputTokens,
      outputTokens,
      costUsd: cost,
      sessionTotal: this.sessionTotal,
      callCount: this.callCount,
    });

    // Also log human-readable format
    console.log(
      `[${timestamp}] Cost: $${cost.toFixed(6)} | Provider: ${provider} | Model: ${model} | Input: ${inputTokens} tokens | Output: ${outputTokens} tokens | Session Total: $${this.sessionTotal.toFixed(6)}`
    );
  }

  /**
   * Get cumulative session cost
   *
   * @returns Total cost in USD for current session
   */
  getSessionTotal(): number {
    return this.sessionTotal;
  }

  /**
   * Get number of calls tracked in current session
   *
   * @returns Number of API calls tracked
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Track a compression event and log its metrics
   *
   * @param beforeTokens - Number of tokens before compression
   * @param afterTokens - Number of tokens after compression
   * @param mode - Compression mode used (sliding, semantic, adaptive)
   */
  trackCompression(beforeTokens: number, afterTokens: number, mode: string): void {
    const reduction = beforeTokens - afterTokens;
    const reductionPercent = beforeTokens > 0 ? (reduction / beforeTokens) * 100 : 0;

    const record: CompressionRecord = {
      timestamp: new Date().toISOString(),
      beforeTokens,
      afterTokens,
      reduction,
      reductionPercent,
      mode,
    };

    this.compressionHistory.push(record);
    this.totalTokensSaved += reduction;

    this.logCompression(record);
  }

  /**
   * Log compression details in structured format
   *
   * Format:
   * [TIMESTAMP] Compression: sliding | Before: 10000 tokens | After: 5000 tokens | Saved: 5000 tokens (50.00%) | Total Saved: 15000 tokens
   *
   * @param record - Compression record to log
   */
  logCompression(record: CompressionRecord): void {
    const timestamp = record.timestamp;

    // Log in structured format for easy parsing
    logger.info({
      type: "compression_event",
      timestamp,
      beforeTokens: record.beforeTokens,
      afterTokens: record.afterTokens,
      reduction: record.reduction,
      reductionPercent: record.reductionPercent,
      mode: record.mode,
      totalTokensSaved: this.totalTokensSaved,
      compressionCount: this.compressionHistory.length,
    });

    // Also log human-readable format
    console.log(
      `[${timestamp}] Compression: ${record.mode} | Before: ${record.beforeTokens} tokens | After: ${record.afterTokens} tokens | Saved: ${record.reduction} tokens (${record.reductionPercent.toFixed(2)}%) | Total Saved: ${this.totalTokensSaved} tokens`
    );
  }

  /**
   * Get compression history for current session
   *
   * @returns Array of compression records, oldest first
   */
  getCompressionHistory(): CompressionRecord[] {
    return [...this.compressionHistory];
  }

  /**
   * Get total tokens saved through compression in current session
   *
   * @returns Total number of tokens saved across all compressions
   */
  getTotalTokensSaved(): number {
    return this.totalTokensSaved;
  }

  /**
   * Get number of compression events tracked in current session
   *
   * @returns Number of compression events tracked
   */
  getCompressionCount(): number {
    return this.compressionHistory.length;
  }

  /**
   * Reset session tracking
   *
   * Useful for:
   * - Starting a new session
   * - Testing
   * - Budget period reset
   */
  reset(): void {
    this.sessionTotal = 0.0;
    this.callCount = 0;
    this.compressionHistory = [];
    this.totalTokensSaved = 0;

    logger.info("Cost tracker reset - session total, call count, and compression history cleared");
  }

  /**
   * Get cost rates for a provider
   *
   * @param provider - Provider ID
   * @returns Cost rates or undefined if provider not found
   */
  getRates(provider: string): CostRates | undefined {
    return PROVIDER_RATES[provider];
  }

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
  updateRates(provider: string, rates: CostRates): void {
    PROVIDER_RATES[provider] = rates;
    logger.info({ provider, rates }, "Cost rates updated for provider");
  }
}

/**
 * Singleton instance for global use
 * Can be imported and used across the application
 */
export const costTracker = new CostTracker();

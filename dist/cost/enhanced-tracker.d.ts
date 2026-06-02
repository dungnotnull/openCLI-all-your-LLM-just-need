/**
 * Enhanced Cost Tracker with Rolling Period Totals
 *
 * Extends base CostTracker with:
 * - Daily, weekly, monthly rolling totals
 * - Per-provider cost tracking
 * - Budget enforcement
 * - Cost export capabilities
 */
import type { CostRates } from './tracker.js';
/**
 * Cost record with timestamp and provider
 */
export interface PeriodCostRecord {
    timestamp: Date;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
}
/**
 * Period totals
 */
export interface PeriodTotals {
    daily: number;
    weekly: number;
    monthly: number;
}
/**
 * Per-provider cost summary
 */
export interface ProviderCostSummary {
    provider: string;
    totalCost: number;
    callCount: number;
    averageCostPerCall: number;
}
/**
 * Enhanced cost tracker options
 */
export interface EnhancedTrackerOptions {
    storagePath?: string;
    budgetLimit?: number;
    budgetWarningPercent?: number;
}
/**
 * Enhanced Cost Tracker Class
 *
 * Tracks costs across rolling periods (daily, weekly, monthly)
 * and supports budget enforcement.
 */
export declare class EnhancedCostTracker {
    private sessionTotal;
    private callCount;
    private records;
    private storagePath;
    private budgetLimit?;
    private budgetWarningPercent;
    constructor(options?: EnhancedTrackerOptions);
    /**
     * Track an API call
     */
    trackCall(provider: string, model: string, inputTokens: number, outputTokens: number, rates: CostRates): void;
    /**
     * Calculate cost from rates
     */
    private calculateCost;
    /**
     * Get session total
     */
    getSessionTotal(): number;
    /**
     * Get call count
     */
    getCallCount(): number;
    /**
     * Get rolling period totals
     */
    getPeriodTotals(): PeriodTotals;
    /**
     * Get per-provider cost summary
     */
    getProviderSummary(): ProviderCostSummary[];
    /**
     * Check if budget would be exceeded
     */
    checkBudget(additionalCost?: number): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Export costs to CSV
     */
    exportToCSV(filePath?: string): Promise<string>;
    /**
     * Load persisted records from disk
     */
    loadFromStorage(): Promise<void>;
    /**
     * Persist records to disk
     */
    saveToStorage(): Promise<void>;
    /**
     * Reset tracker
     */
    reset(): void;
    /**
     * Set budget limit
     */
    setBudgetLimit(limit: number): void;
    /**
     * Get budget limit
     */
    getBudgetLimit(): number | undefined;
    /**
     * Get cost rates for a provider
     * @param provider - Provider ID
     * @returns Cost rates or undefined if provider not found
     */
    getRates(provider: string): CostRates | undefined;
}
//# sourceMappingURL=enhanced-tracker.d.ts.map
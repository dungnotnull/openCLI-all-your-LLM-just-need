/**
 * Budget Guard Middleware
 *
 * Warns at 80% budget usage and blocks at 100%.
 * Integrates with agent loop to prevent overspending.
 */
import type { ChatOptions, Delta, ModelProvider } from '../types/index.js';
import type { EnhancedTrackerOptions } from './enhanced-tracker.js';
import { EnhancedCostTracker } from './enhanced-tracker.js';
/**
 * Budget check result
 */
export interface BudgetCheckResult {
    allowed: boolean;
    warning?: string;
    blocked?: string;
    currentSpend: number;
    budgetLimit: number;
    percentUsed: number;
}
/**
 * Budget guard configuration
 */
export interface BudgetGuardConfig {
    enabled: boolean;
    limit: number;
    warnPercent: number;
    allowOverride: boolean;
}
/**
 * Budget Guard Middleware
 *
 * Wraps provider.chat() to enforce budget limits.
 */
export declare class BudgetGuard {
    private config;
    private tracker;
    private ignoreBudget;
    constructor(config?: Partial<BudgetGuardConfig>, trackerOptions?: EnhancedTrackerOptions);
    /**
     * Enable or disable budget enforcement
     */
    setEnabled(enabled: boolean): void;
    /**
     * Set budget limit
     */
    setBudgetLimit(limit: number): void;
    /**
     * Ignore budget for current operation (requires --ignore-budget flag)
     */
    ignoreBudgetForNextCall(): void;
    /**
     * Check if a call is allowed under budget
     */
    checkBudget(estimatedCost?: number): BudgetCheckResult;
    /**
     * Wrap provider.chat() with budget checking
     */
    chatWithBudgetGuard(provider: ModelProvider, messages: any[], options: ChatOptions, estimatedCost?: number): AsyncGenerator<Delta>;
    /**
     * Get tracker instance
     */
    getTracker(): EnhancedCostTracker;
    /**
     * Get budget status
     */
    getBudgetStatus(): {
        enabled: boolean;
        limit: number;
        currentSpend: number;
        percentUsed: number;
        remaining: number;
    };
}
/**
 * Get or create budget guard instance
 */
export declare function getBudgetGuard(config?: Partial<BudgetGuardConfig>): BudgetGuard;
//# sourceMappingURL=budget-guard.d.ts.map
/**
 * Budget Guard Middleware
 *
 * Warns at 80% budget usage and blocks at 100%.
 * Integrates with agent loop to prevent overspending.
 */
import { EnhancedCostTracker } from './enhanced-tracker.js';
import { logger } from '../utils/logger.js';
/**
 * Default budget guard configuration
 */
const DEFAULT_CONFIG = {
    enabled: false,
    limit: 10.0, // $10 default limit
    warnPercent: 0.8,
    allowOverride: true,
};
/**
 * Budget Guard Middleware
 *
 * Wraps provider.chat() to enforce budget limits.
 */
export class BudgetGuard {
    config;
    tracker;
    ignoreBudget = false;
    constructor(config, trackerOptions) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.tracker = new EnhancedCostTracker(trackerOptions);
    }
    /**
     * Enable or disable budget enforcement
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
    /**
     * Set budget limit
     */
    setBudgetLimit(limit) {
        this.config.limit = limit;
        this.tracker.setBudgetLimit(limit);
    }
    /**
     * Ignore budget for current operation (requires --ignore-budget flag)
     */
    ignoreBudgetForNextCall() {
        if (!this.config.allowOverride) {
            throw new Error('Budget override is not allowed. Remove --allow-budget-override flag.');
        }
        // In production, this would require user confirmation
        // For now, just log it
        logger.warn('Ignoring budget limit for next call');
        this.ignoreBudget = true;
    }
    /**
     * Check if a call is allowed under budget
     */
    checkBudget(estimatedCost = 0) {
        if (!this.config.enabled) {
            return {
                allowed: true,
                currentSpend: this.tracker.getSessionTotal(),
                budgetLimit: this.config.limit,
                percentUsed: 0,
            };
        }
        if (this.ignoreBudget) {
            this.ignoreBudget = false;
            logger.warn('Budget check bypassed via --ignore-budget');
            return {
                allowed: true,
                warning: 'Budget check bypassed',
                currentSpend: this.tracker.getSessionTotal(),
                budgetLimit: this.config.limit,
                percentUsed: (this.tracker.getSessionTotal() / this.config.limit) * 100,
            };
        }
        const currentSpend = this.tracker.getSessionTotal();
        const projectedSpend = currentSpend + estimatedCost;
        const percentUsed = (currentSpend / this.config.limit) * 100;
        // Check if budget would be exceeded
        if (projectedSpend >= this.config.limit) {
            logger.error({
                currentSpend,
                projectedSpend,
                limit: this.config.limit,
            }, 'Budget limit exceeded');
            return {
                allowed: false,
                blocked: `Budget limit of $${this.config.limit.toFixed(2)} would be exceeded (current: $${currentSpend.toFixed(2)}, projected: $${projectedSpend.toFixed(2)})`,
                currentSpend,
                budgetLimit: this.config.limit,
                percentUsed,
            };
        }
        // Check if warning threshold reached
        if (currentSpend / this.config.limit >= this.config.warnPercent) {
            const warnPercent = Math.floor(this.config.warnPercent * 100);
            logger.warn({
                currentSpend,
                limit: this.config.limit,
                percentUsed,
            }, `Budget warning threshold (${warnPercent}%) reached`);
            return {
                allowed: true,
                warning: `${Math.floor(percentUsed)}% of budget used ($${currentSpend.toFixed(2)} / $${this.config.limit.toFixed(2)})`,
                currentSpend,
                budgetLimit: this.config.limit,
                percentUsed,
            };
        }
        return {
            allowed: true,
            currentSpend,
            budgetLimit: this.config.limit,
            percentUsed,
        };
    }
    /**
     * Wrap provider.chat() with budget checking
     */
    async *chatWithBudgetGuard(provider, messages, options, estimatedCost = 0) {
        // Check budget before call
        const budgetCheck = this.checkBudget(estimatedCost);
        if (!budgetCheck.allowed) {
            throw new Error(budgetCheck.blocked || 'Budget limit exceeded');
        }
        if (budgetCheck.warning) {
            console.warn(`⚠️  ${budgetCheck.warning}`);
        }
        // Track the call (we'll estimate tokens for now)
        // In production, count actual tokens from messages
        const estimatedInputTokens = await provider.countTokens(messages);
        const estimatedOutputTokens = options.maxTokens || 2048;
        // Stream the response
        let outputTokens = 0;
        const stream = provider.chat(messages, options);
        for await (const delta of stream) {
            if (delta.type === 'content' && delta.content) {
                // Rough token estimation (1 token ≈ 4 characters for English)
                outputTokens += Math.ceil(delta.content.length / 4);
            }
            yield delta;
        }
        // Track final cost after streaming
        // Note: This is approximate - real costs come from provider response
        const rates = this.tracker.getRates(provider.id) || { inputCostPerMillion: 0.14, outputCostPerMillion: 0.28 };
        this.tracker.trackCall(provider.id, options.model || provider.models[0]?.id || 'unknown', estimatedInputTokens, outputTokens, rates);
    }
    /**
     * Get tracker instance
     */
    getTracker() {
        return this.tracker;
    }
    /**
     * Get budget status
     */
    getBudgetStatus() {
        const currentSpend = this.tracker.getSessionTotal();
        return {
            enabled: this.config.enabled,
            limit: this.config.limit,
            currentSpend,
            percentUsed: this.config.enabled ? (currentSpend / this.config.limit) * 100 : 0,
            remaining: this.config.enabled ? this.config.limit - currentSpend : Infinity,
        };
    }
}
/**
 * Singleton instance
 */
let budgetGuardInstance = null;
/**
 * Get or create budget guard instance
 */
export function getBudgetGuard(config) {
    if (!budgetGuardInstance) {
        budgetGuardInstance = new BudgetGuard(config);
    }
    return budgetGuardInstance;
}
//# sourceMappingURL=budget-guard.js.map
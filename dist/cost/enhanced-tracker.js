/**
 * Enhanced Cost Tracker with Rolling Period Totals
 *
 * Extends base CostTracker with:
 * - Daily, weekly, monthly rolling totals
 * - Per-provider cost tracking
 * - Budget enforcement
 * - Cost export capabilities
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const PROVIDER_RATES = {
    deepseek: { inputCostPerMillion: 0.14, outputCostPerMillion: 0.28 },
    qwen: { inputCostPerMillion: 0.50, outputCostPerMillion: 1.00 },
    minimax: { inputCostPerMillion: 0.10, outputCostPerMillion: 0.20 },
    glm: { inputCostPerMillion: 0.30, outputCostPerMillion: 0.60 },
    kimi: { inputCostPerMillion: 2.00, outputCostPerMillion: 4.00 },
    devstral: { inputCostPerMillion: 0.50, outputCostPerMillion: 1.00 },
    ollama: { inputCostPerMillion: 0, outputCostPerMillion: 0 },
    claude: { inputCostPerMillion: 3.00, outputCostPerMillion: 15.00 },
    gpt: { inputCostPerMillion: 2.50, outputCostPerMillion: 10.00 },
    gemini: { inputCostPerMillion: 0.075, outputCostPerMillion: 0.30 },
    grok: { inputCostPerMillion: 5.00, outputCostPerMillion: 15.00 },
};
/**
 * Enhanced Cost Tracker Class
 *
 * Tracks costs across rolling periods (daily, weekly, monthly)
 * and supports budget enforcement.
 */
export class EnhancedCostTracker {
    sessionTotal = 0.0;
    callCount = 0;
    records = [];
    storagePath;
    budgetLimit;
    budgetWarningPercent;
    constructor(options = {}) {
        this.storagePath = options.storagePath || join(homedir(), '.opencli', 'costs.json');
        this.budgetLimit = options.budgetLimit;
        this.budgetWarningPercent = options.budgetWarningPercent || 0.8;
    }
    /**
     * Track an API call
     */
    trackCall(provider, model, inputTokens, outputTokens, rates) {
        const cost = this.calculateCost(rates, inputTokens, outputTokens);
        this.sessionTotal += cost;
        this.callCount++;
        const record = {
            timestamp: new Date(),
            provider,
            model,
            inputTokens,
            outputTokens,
            costUsd: cost,
        };
        this.records.push(record);
    }
    /**
     * Calculate cost from rates
     */
    calculateCost(rates, inputTokens, outputTokens) {
        const inputCost = (inputTokens / 1_000_000) * rates.inputCostPerMillion;
        const outputCost = (outputTokens / 1_000_000) * rates.outputCostPerMillion;
        return inputCost + outputCost;
    }
    /**
     * Get session total
     */
    getSessionTotal() {
        return this.sessionTotal;
    }
    /**
     * Get call count
     */
    getCallCount() {
        return this.callCount;
    }
    /**
     * Get rolling period totals
     */
    getPeriodTotals() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        let daily = 0;
        let weekly = 0;
        let monthly = 0;
        for (const record of this.records) {
            if (record.timestamp >= dayAgo) {
                daily += record.costUsd;
            }
            if (record.timestamp >= weekAgo) {
                weekly += record.costUsd;
            }
            if (record.timestamp >= monthAgo) {
                monthly += record.costUsd;
            }
        }
        return { daily, weekly, monthly };
    }
    /**
     * Get per-provider cost summary
     */
    getProviderSummary() {
        const byProvider = new Map();
        for (const record of this.records) {
            const existing = byProvider.get(record.provider) || { totalCost: 0, callCount: 0 };
            existing.totalCost += record.costUsd;
            existing.callCount++;
            byProvider.set(record.provider, existing);
        }
        return Array.from(byProvider.entries()).map(([provider, data]) => ({
            provider,
            totalCost: data.totalCost,
            callCount: data.callCount,
            averageCostPerCall: data.callCount > 0 ? data.totalCost / data.callCount : 0,
        }));
    }
    /**
     * Check if budget would be exceeded
     */
    checkBudget(additionalCost = 0) {
        if (!this.budgetLimit) {
            return { allowed: true };
        }
        const projected = this.sessionTotal + additionalCost;
        const percent = projected / this.budgetLimit;
        if (projected >= this.budgetLimit) {
            return {
                allowed: false,
                reason: `Budget limit ($${this.budgetLimit.toFixed(2)}) would be exceeded`,
            };
        }
        if (percent >= this.budgetWarningPercent) {
            return {
                allowed: true,
                reason: `Warning: ${Math.floor(percent * 100)}% of budget used`,
            };
        }
        return { allowed: true };
    }
    /**
     * Export costs to CSV
     */
    async exportToCSV(filePath) {
        const outputPath = filePath || join(homedir(), '.opencli', 'costs-export.csv');
        const headers = ['timestamp', 'provider', 'model', 'input_tokens', 'output_tokens', 'cost_usd'];
        const rows = this.records.map(r => [
            r.timestamp.toISOString(),
            r.provider,
            r.model,
            r.inputTokens.toString(),
            r.outputTokens.toString(),
            r.costUsd.toFixed(6),
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        await fs.writeFile(outputPath, csv);
        return outputPath;
    }
    /**
     * Load persisted records from disk
     */
    async loadFromStorage() {
        try {
            const data = await fs.readFile(this.storagePath, 'utf-8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed.records)) {
                this.records = parsed.records.map((r) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
            }
            if (typeof parsed.budgetLimit === 'number') {
                this.budgetLimit = parsed.budgetLimit;
            }
        }
        catch (error) {
            // File doesn't exist or is invalid - start fresh
        }
    }
    /**
     * Persist records to disk
     */
    async saveToStorage() {
        const data = {
            records: this.records,
            budgetLimit: this.budgetLimit,
        };
        await fs.mkdir(join(this.storagePath, '..'), { recursive: true });
        await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2));
    }
    /**
     * Reset tracker
     */
    reset() {
        this.sessionTotal = 0.0;
        this.callCount = 0;
        this.records = [];
    }
    /**
     * Set budget limit
     */
    setBudgetLimit(limit) {
        this.budgetLimit = limit;
    }
    /**
     * Get budget limit
     */
    getBudgetLimit() {
        return this.budgetLimit;
    }
    /**
     * Get cost rates for a provider
     * @param provider - Provider ID
     * @returns Cost rates or undefined if provider not found
     */
    getRates(provider) {
        return PROVIDER_RATES[provider];
    }
}
//# sourceMappingURL=enhanced-tracker.js.map
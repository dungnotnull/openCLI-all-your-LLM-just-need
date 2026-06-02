/**
 * Cost rate tables for all providers
 * Prices in USD per 1M tokens
 * Updated: 2026-06-01
 */
export interface ProviderRates {
    inputCostPerMillion: number;
    outputCostPerMillion: number;
    note?: string;
}
export declare const COST_RATES: Record<string, Record<string, ProviderRates>>;
export declare function getRate(providerId: string, modelId: string): ProviderRates | null;
export declare function calculateCost(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number;
//# sourceMappingURL=rates.d.ts.map
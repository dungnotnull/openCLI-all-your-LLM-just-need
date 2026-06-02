/**
 * Cost Dashboard Command
 *
 * Displays cost statistics and per-provider breakdown.
 * Usage: opencli --cost or opencli cost export
 */
/**
 * Cost dashboard options
 */
export interface CostDashboardOptions {
    provider?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'all';
    format?: 'table' | 'json' | 'csv';
    exportPath?: string;
}
/**
 * Display cost dashboard
 */
export declare function showCostDashboard(options?: CostDashboardOptions): Promise<void>;
/**
 * Export costs to file
 */
export declare function exportCosts(options?: CostDashboardOptions): Promise<string>;
/**
 * Setup cost command for CLI
 */
export declare function setupCostCommand(program: any): void;
//# sourceMappingURL=cost.d.ts.map
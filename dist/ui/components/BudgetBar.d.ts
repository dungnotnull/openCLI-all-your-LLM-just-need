/**
 * BudgetBar Component
 *
 * Progress indicator for budget usage.
 * Shows red at 80% budget used.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
export interface BudgetBarProps extends ComponentProps {
    spent: number;
    limit: number;
    percent: number;
}
/**
 * BudgetBar component
 *
 * Shows: Red at 80% budget used
 */
export declare function BudgetBar(props: BudgetBarProps): string;
/**
 * Get budget status message
 */
export declare function getBudgetStatus(percent: number): string;
/**
 * Format budget as currency
 */
export declare function formatBudget(amount: number): string;
//# sourceMappingURL=BudgetBar.d.ts.map
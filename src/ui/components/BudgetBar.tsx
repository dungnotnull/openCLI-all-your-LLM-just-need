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
import { colors } from '../theme.js';

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
export function BudgetBar(props: BudgetBarProps): string {
  const { spent, limit, percent } = props;

  // Calculate bar width (use 20 characters for full bar)
  const barWidth = 20;
  const filled = Math.round((percent / 100) * barWidth);
  const empty = barWidth - filled;

  // Determine color based on usage
  let color = colors.success;
  let status = 'OK';

  if (percent >= 80) {
    color = colors.error;
    status = 'CRITICAL';
  } else if (percent >= 50) {
    color = colors.warning;
    status = 'WARNING';
  }

  const bar = color('█'.repeat(filled)) + colors.dim('░'.repeat(empty));

  return `${colors.bold('Budget:')} $${spent.toFixed(2)} / $${limit.toFixed(2)} (${percent.toFixed(0)}%) ${status}
[${bar}]`;
}

/**
 * Get budget status message
 */
export function getBudgetStatus(percent: number): string {
  if (percent >= 100) {
    return 'Budget exceeded!';
  } else if (percent >= 80) {
    return 'Approaching budget limit';
  } else if (percent >= 50) {
    return 'Half of budget used';
  }
  return 'Budget OK';
}

/**
 * Format budget as currency
 */
export function formatBudget(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

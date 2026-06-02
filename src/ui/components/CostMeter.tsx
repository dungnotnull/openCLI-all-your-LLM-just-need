/**
 * CostMeter Component
 *
 * Displays live token count and USD cost updates.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */

import type { ComponentProps } from '../types.js';
import { colors } from '../theme.js';

export interface CostMeterProps extends ComponentProps {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

/**
 * CostMeter component
 *
 * Shows: Token count + USD live update
 */
export function CostMeter(props: CostMeterProps): string {
  const { inputTokens, outputTokens, totalCost } = props;
  const totalTokens = inputTokens + outputTokens;

  if (totalTokens === 0) {
    return `${colors.muted('Cost: $0.000000 | 0 tokens')}`;
  }

  return `${colors.primary(`Cost: $${totalCost.toFixed(6)} | ${totalTokens} tokens`)}
${colors.dim(`  Input: ${inputTokens} | Output: ${outputTokens}`)}`;
}

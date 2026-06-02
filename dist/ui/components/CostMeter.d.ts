/**
 * CostMeter Component
 *
 * Displays live token count and USD cost updates.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
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
export declare function CostMeter(props: CostMeterProps): string;
//# sourceMappingURL=CostMeter.d.ts.map
/**
 * ThinkingSpinner Component
 *
 * Animated spinner shown during model inference.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
export interface ThinkingSpinnerProps extends ComponentProps {
    phase: 'thinking' | 'streaming' | 'tool_executing' | 'idle';
    message?: string;
}
/**
 * ThinkingSpinner component
 *
 * Shows: Animated during model inference
 */
export declare function ThinkingSpinner(props: ThinkingSpinnerProps): string;
//# sourceMappingURL=ThinkingSpinner.d.ts.map
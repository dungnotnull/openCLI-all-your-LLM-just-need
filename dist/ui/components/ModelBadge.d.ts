/**
 * ModelBadge Component
 *
 * Displays the current provider and model name in the top-right.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
export interface ModelBadgeProps extends ComponentProps {
    provider: string;
    model: string;
}
/**
 * ModelBadge component
 *
 * Shows: Provider + model name top-right
 */
export declare function ModelBadge(props: ModelBadgeProps): string;
//# sourceMappingURL=ModelBadge.d.ts.map
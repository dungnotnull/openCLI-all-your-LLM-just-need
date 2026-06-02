/**
 * KnowledgePulse Component
 *
 * Subtle indicator showing when knowledge brain was consulted.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
export interface KnowledgePulseProps extends ComponentProps {
    active: boolean;
    entriesFound?: number;
    lastQuery?: string;
}
/**
 * KnowledgePulse component
 *
 * Shows: When knowledge brain was consulted
 */
export declare function KnowledgePulse(props: KnowledgePulseProps): string;
/**
 * Knowledge brief component - shows compact knowledge info
 */
export declare function KnowledgeBrief(props: {
    count: number;
    category?: string;
}): string;
/**
 * Get knowledge icon based on status
 */
export declare function getKnowledgeIcon(active: boolean, hasResults: boolean): string;
//# sourceMappingURL=KnowledgePulse.d.ts.map
/**
 * DiffViewer Component
 *
 * Color-coded diff viewer with approve/reject functionality.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import type { ComponentProps } from '../types.js';
export interface DiffViewerProps extends ComponentProps {
    original: string;
    modified: string;
    filename?: string;
    onApprove?: () => void;
    onReject?: () => void;
}
/**
 * DiffViewer component
 *
 * Shows: Color-coded diff with keyboard navigation
 */
export declare function DiffViewer(props: DiffViewerProps): string;
/**
 * Simple diff line type
 */
export interface DiffLine {
    type: 'unchanged' | 'added' | 'removed';
    content: string;
    lineNumber: number;
}
/**
 * Parse unified diff format
 */
export declare function parseUnifiedDiff(diff: string): DiffLine[];
/**
 * Render diff lines with colors
 */
export declare function renderDiffLines(lines: DiffLine[]): string;
//# sourceMappingURL=DiffViewer.d.ts.map
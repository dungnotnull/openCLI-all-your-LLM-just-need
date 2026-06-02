/**
 * DiffViewer Component
 *
 * Color-coded diff viewer with approve/reject functionality.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import { colors } from '../theme.js';
/**
 * DiffViewer component
 *
 * Shows: Color-coded diff with keyboard navigation
 */
export function DiffViewer(props) {
    const { original, modified, filename, onApprove, onReject } = props;
    const lines = [];
    if (filename) {
        lines.push(`${colors.bold(`File: ${filename}`)}`);
        lines.push('');
    }
    // Simple diff implementation
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    let lineNumber = 1;
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
        const origLine = originalLines[i];
        const modLine = modifiedLines[i];
        if (origLine === modLine) {
            // Unchanged line
            if (origLine !== undefined) {
                lines.push(`${colors.muted(`${lineNumber}.  ${origLine}`)}`);
                lineNumber++;
            }
        }
        else {
            // Changed line
            if (origLine !== undefined) {
                lines.push(`${colors.error(`-   ${origLine}`)}`);
            }
            if (modLine !== undefined) {
                lines.push(`${colors.success(`+   ${modLine}`)}`);
            }
            lineNumber++;
        }
    }
    // Add approval instructions
    if (onApprove || onReject) {
        lines.push('');
        lines.push(`${colors.dim('Press [Y] to approve, [N] to reject, [Q] to quit')}`);
    }
    return lines.join('\n');
}
/**
 * Parse unified diff format
 */
export function parseUnifiedDiff(diff) {
    const lines = [];
    const diffLines = diff.split('\n');
    let lineNumber = 1;
    for (const line of diffLines) {
        if (line.startsWith('@@')) {
            // Header line, skip
            continue;
        }
        else if (line.startsWith('+')) {
            lines.push({
                type: 'added',
                content: line.slice(1),
                lineNumber: lineNumber++,
            });
        }
        else if (line.startsWith('-')) {
            lines.push({
                type: 'removed',
                content: line.slice(1),
                lineNumber: lineNumber++,
            });
        }
        else if (line.startsWith(' ')) {
            lines.push({
                type: 'unchanged',
                content: line.slice(1),
                lineNumber: lineNumber++,
            });
        }
    }
    return lines;
}
/**
 * Render diff lines with colors
 */
export function renderDiffLines(lines) {
    return lines
        .map(line => {
        switch (line.type) {
            case 'added':
                return `${colors.success(`+ ${line.content}`)}`;
            case 'removed':
                return `${colors.error(`- ${line.content}`)}`;
            case 'unchanged':
                return `${colors.muted(`  ${line.content}`)}`;
        }
    })
        .join('\n');
}
//# sourceMappingURL=DiffViewer.js.map
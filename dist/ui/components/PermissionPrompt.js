/**
 * Permission Prompt Component
 *
 * Interactive Y/n prompt for bash/file-write operations.
 * Shows full command before execution.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import { colors } from '../theme.js';
/**
 * PermissionPrompt component
 *
 * Shows: Y/n with full command shown
 */
export function PermissionPrompt(props) {
    const { type, command, filePath, content } = props;
    const lines = [];
    // Header
    lines.push('');
    lines.push(`${colors.warning('⚠ Permission Required')}`);
    lines.push('');
    // Type-specific display
    switch (type) {
        case 'bash':
            lines.push(`${colors.bold('Execute bash command:')}`);
            if (command) {
                lines.push('');
                lines.push(colors.dim(command));
            }
            break;
        case 'file-write':
            lines.push(`${colors.bold('Write file:')}`);
            if (filePath) {
                lines.push(colors.primary(filePath));
            }
            if (content) {
                const preview = content.length > 200
                    ? content.slice(0, 200) + '\n... (truncated)'
                    : content;
                lines.push('');
                lines.push(colors.dim(preview));
            }
            break;
        case 'file-edit':
            lines.push(`${colors.bold('Edit file:')}`);
            if (filePath) {
                lines.push(colors.primary(filePath));
            }
            break;
        case 'file-read':
            lines.push(`${colors.bold('Read file:')}`);
            if (filePath) {
                lines.push(colors.primary(filePath));
            }
            break;
    }
    // Instructions
    lines.push('');
    lines.push(`${colors.dim('Press [Y] to allow, [N] to deny, [A] to allow all')}`);
    lines.push('');
    return lines.join('\n');
}
/**
 * Format command for display
 */
export function formatCommand(command) {
    const maxLength = 80;
    if (command.length <= maxLength) {
        return command;
    }
    // Truncate with ellipsis
    return command.slice(0, maxLength - 3) + '...';
}
/**
 * Format file content preview
 */
export function formatContentPreview(content, maxLines = 5) {
    const lines = content.split('\n');
    const previewLines = lines.slice(0, maxLines);
    let preview = previewLines.join('\n');
    if (lines.length > maxLines) {
        preview += `\n${colors.dim(`... (${lines.length - maxLines} more lines)`)}`;
    }
    return preview;
}
/**
 * Create initial permission state
 */
export function createPermissionState() {
    return {
        pending: false,
        allowAll: false,
    };
}
/**
 * Check if permission should be granted
 */
export function shouldAllowPermission(state, response) {
    if (state.allowAll) {
        return true;
    }
    const normalized = response.toLowerCase().trim();
    return normalized === 'y' || normalized === 'yes';
}
/**
 * Check if user wants to allow all future permissions
 */
export function shouldAllowAll(response) {
    const normalized = response.toLowerCase().trim();
    return normalized === 'a' || normalized === 'all';
}
//# sourceMappingURL=PermissionPrompt.js.map
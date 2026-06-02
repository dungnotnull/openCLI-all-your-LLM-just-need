/**
 * Permission Prompt Component
 *
 * Interactive Y/n prompt for bash/file-write operations.
 * Shows full command before execution.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */

import type { ComponentProps } from '../types.js';
import { colors } from '../theme.js';

export interface PermissionPromptProps extends ComponentProps {
  type: 'bash' | 'file-write' | 'file-edit' | 'file-read';
  command?: string;
  filePath?: string;
  content?: string;
  onAllow: () => void;
  onDeny: () => void;
}

/**
 * PermissionPrompt component
 *
 * Shows: Y/n with full command shown
 */
export function PermissionPrompt(props: PermissionPromptProps): string {
  const { type, command, filePath, content } = props;

  const lines: string[] = [];

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
export function formatCommand(command: string): string {
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
export function formatContentPreview(content: string, maxLines: number = 5): string {
  const lines = content.split('\n');
  const previewLines = lines.slice(0, maxLines);

  let preview = previewLines.join('\n');

  if (lines.length > maxLines) {
    preview += `\n${colors.dim(`... (${lines.length - maxLines} more lines)`)}`;
  }

  return preview;
}

/**
 * Permission prompt state
 */
export interface PermissionState {
  pending: boolean;
  type?: 'bash' | 'file-write' | 'file-edit' | 'file-read';
  command?: string;
  filePath?: string;
  allowAll: boolean;
}

/**
 * Create initial permission state
 */
export function createPermissionState(): PermissionState {
  return {
    pending: false,
    allowAll: false,
  };
}

/**
 * Check if permission should be granted
 */
export function shouldAllowPermission(
  state: PermissionState,
  response: string
): boolean {
  if (state.allowAll) {
    return true;
  }

  const normalized = response.toLowerCase().trim();
  return normalized === 'y' || normalized === 'yes';
}

/**
 * Check if user wants to allow all future permissions
 */
export function shouldAllowAll(response: string): boolean {
  const normalized = response.toLowerCase().trim();
  return normalized === 'a' || normalized === 'all';
}

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
export declare function PermissionPrompt(props: PermissionPromptProps): string;
/**
 * Format command for display
 */
export declare function formatCommand(command: string): string;
/**
 * Format file content preview
 */
export declare function formatContentPreview(content: string, maxLines?: number): string;
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
export declare function createPermissionState(): PermissionState;
/**
 * Check if permission should be granted
 */
export declare function shouldAllowPermission(state: PermissionState, response: string): boolean;
/**
 * Check if user wants to allow all future permissions
 */
export declare function shouldAllowAll(response: string): boolean;
//# sourceMappingURL=PermissionPrompt.d.ts.map
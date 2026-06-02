/**
 * File Edit Tool for OpenCLI
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Edit files using diff-based patching
 * - Phase 1: Simple text replacement and append
 * - Phase 3: Full context-aware diff patching (future)
 *
 * Current implementation supports:
 * - Search and replace: "old_text >>>> new_text"
 * - Append mode: ">>> content to append"
 */
import { Tool, ToolResult } from "../types/index.js";
/**
 * File Edit Tool Class
 *
 * Edits files using simple text replacement or append operations.
 * Full diff-based patching will be implemented in Phase 3 with context compression.
 */
export declare class FileEditTool extends Tool {
    readonly name = "file_edit";
    readonly description = "Edit a file using simple text replacement or append";
    readonly inputSchema: {
        type: string;
        properties: {
            filePath: {
                type: string;
                description: string;
            };
            patch: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    /**
     * Execute file edit operation
     *
     * @param input - Tool input containing filePath and patch
     * @returns Tool result with confirmation message or error
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Parse and validate tool input
     */
    private parseInput;
    /**
     * Apply patch to content
     *
     * Supports two operations:
     * - Replacement: "old_text >>>> new_text" (replaces first occurrence)
     * - Append: ">>> content" (appends to end of file)
     *
     * @param currentContent - Current file content
     * @param patch - Patch string with operation
     * @returns Modified content
     */
    private applyPatch;
    /**
     * Detect the type of operation performed
     *
     * @param patch - Patch string
     * @returns Description of operation
     */
    private detectOperation;
    /**
     * Generate a unique tool call ID
     */
    private generateToolCallId;
}
//# sourceMappingURL=file-edit.d.ts.map
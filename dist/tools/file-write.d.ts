/**
 * File Write Tool for OpenCLI
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Write content to a file
 * - Optionally create parent directories
 * - Overwrite existing files
 * - Handle errors (permission denied, invalid path)
 */
import { Tool, ToolResult } from "../types/index.js";
/**
 * File Write Tool Class
 *
 * Writes content to files with optional directory creation.
 * Creates parent directories if createDirs flag is true.
 */
export declare class FileWriteTool extends Tool {
    readonly name = "file_write";
    readonly description = "Write content to a file";
    readonly inputSchema: {
        type: string;
        properties: {
            filePath: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            createDirs: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
    /**
     * Execute file write operation
     *
     * @param input - Tool input containing filePath, content, and optional createDirs
     * @returns Tool result with confirmation message or error
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Parse and validate tool input
     */
    private parseInput;
    /**
     * Generate a unique tool call ID
     */
    private generateToolCallId;
}
//# sourceMappingURL=file-write.d.ts.map
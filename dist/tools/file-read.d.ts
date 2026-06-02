/**
 * File Read Tool for OpenCLI
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Read file contents from disk
 * - Validate file path exists and is readable
 * - Return file contents as string
 * - Handle errors (file not found, permission denied)
 */
import { Tool, ToolResult } from "../types/index.js";
/**
 * File Read Tool Class
 *
 * Reads file contents from disk with proper error handling.
 * Supports both absolute and relative file paths.
 */
export declare class FileReadTool extends Tool {
    readonly name = "file_read";
    readonly description = "Read the contents of a file";
    readonly inputSchema: {
        type: string;
        properties: {
            filePath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    /**
     * Execute file read operation
     *
     * @param input - Tool input containing filePath
     * @returns Tool result with file contents or error message
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
//# sourceMappingURL=file-read.d.ts.map
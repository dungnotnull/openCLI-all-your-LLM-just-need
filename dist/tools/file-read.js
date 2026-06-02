/**
 * File Read Tool for OpenCLI
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Read file contents from disk
 * - Validate file path exists and is readable
 * - Return file contents as string
 * - Handle errors (file not found, permission denied)
 */
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { Tool } from "../types/index.js";
/**
 * File Read Tool Class
 *
 * Reads file contents from disk with proper error handling.
 * Supports both absolute and relative file paths.
 */
export class FileReadTool extends Tool {
    name = "file_read";
    description = "Read the contents of a file";
    inputSchema = {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "Path to the file to read (absolute or relative)",
            },
        },
        required: ["filePath"],
    };
    /**
     * Execute file read operation
     *
     * @param input - Tool input containing filePath
     * @returns Tool result with file contents or error message
     */
    async execute(input) {
        // Validate and parse input
        const parsed = this.parseInput(input);
        if (!parsed) {
            return {
                toolCallId: this.generateToolCallId(),
                content: "Invalid input: filePath is required and must be a string",
                isError: true,
            };
        }
        const { filePath } = parsed;
        // Check if file exists
        if (!existsSync(filePath)) {
            return {
                toolCallId: this.generateToolCallId(),
                content: `File not found: ${filePath}`,
                isError: true,
            };
        }
        try {
            // Read file contents
            const content = await readFile(filePath, "utf-8");
            return {
                toolCallId: this.generateToolCallId(),
                content: content,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                toolCallId: this.generateToolCallId(),
                content: `Failed to read file: ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Parse and validate tool input
     */
    parseInput(input) {
        const filePath = input.filePath;
        if (!filePath || typeof filePath !== "string") {
            return null;
        }
        return { filePath };
    }
    /**
     * Generate a unique tool call ID
     */
    generateToolCallId() {
        return `file_read_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}
//# sourceMappingURL=file-read.js.map
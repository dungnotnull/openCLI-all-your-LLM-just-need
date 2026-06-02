/**
 * File Write Tool for OpenCLI
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Write content to a file
 * - Optionally create parent directories
 * - Overwrite existing files
 * - Handle errors (permission denied, invalid path)
 */
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { Tool } from "../types/index.js";
/**
 * File Write Tool Class
 *
 * Writes content to files with optional directory creation.
 * Creates parent directories if createDirs flag is true.
 */
export class FileWriteTool extends Tool {
    name = "file_write";
    description = "Write content to a file";
    inputSchema = {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "Path to the file to write (absolute or relative)",
            },
            content: {
                type: "string",
                description: "Content to write to the file",
            },
            createDirs: {
                type: "boolean",
                description: "If true, create parent directories if they don't exist",
                default: false,
            },
        },
        required: ["filePath", "content"],
    };
    /**
     * Execute file write operation
     *
     * @param input - Tool input containing filePath, content, and optional createDirs
     * @returns Tool result with confirmation message or error
     */
    async execute(input) {
        // Validate and parse input
        const parsed = this.parseInput(input);
        if (!parsed) {
            return {
                toolCallId: this.generateToolCallId(),
                content: "Invalid input: filePath and content are required (filePath and content must be strings)",
                isError: true,
            };
        }
        const { filePath, content, createDirs = false } = parsed;
        try {
            // Create parent directories if requested
            if (createDirs) {
                const dir = dirname(filePath);
                await mkdir(dir, { recursive: true });
            }
            // Write content to file
            await writeFile(filePath, content, "utf-8");
            return {
                toolCallId: this.generateToolCallId(),
                content: `Successfully wrote ${content.length} bytes to ${filePath}`,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                toolCallId: this.generateToolCallId(),
                content: `Failed to write file: ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Parse and validate tool input
     */
    parseInput(input) {
        const filePath = input.filePath;
        const content = input.content;
        const createDirs = input.createDirs;
        if (!filePath || typeof filePath !== "string") {
            return null;
        }
        if (content === undefined || typeof content !== "string") {
            return null;
        }
        return {
            filePath,
            content,
            createDirs: createDirs === true ? true : false,
        };
    }
    /**
     * Generate a unique tool call ID
     */
    generateToolCallId() {
        return `file_write_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}
//# sourceMappingURL=file-write.js.map
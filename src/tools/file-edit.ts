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

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { Tool, ToolResult } from "../types/index.js";

/**
 * FileEditInput Schema
 */
interface FileEditInput {
  filePath: string;
  patch: string;
}

/**
 * File Edit Tool Class
 *
 * Edits files using simple text replacement or append operations.
 * Full diff-based patching will be implemented in Phase 3 with context compression.
 */
export class FileEditTool extends Tool {
  readonly name = "file_edit";
  readonly description = "Edit a file using simple text replacement or append";
  readonly inputSchema = {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file to edit (absolute or relative)",
      },
      patch: {
        type: "string",
        description:
          "Patch operation: Use 'old_text >>>> new_text' for replacement, or '>>> content' to append",
      },
    },
    required: ["filePath", "patch"],
  };

  /**
   * Execute file edit operation
   *
   * @param input - Tool input containing filePath and patch
   * @returns Tool result with confirmation message or error
   */
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    // Validate and parse input
    const parsed = this.parseInput(input);
    if (!parsed) {
      return {
        toolCallId: this.generateToolCallId(),
        content:
          "Invalid input: filePath and patch are required (filePath and patch must be strings)",
        isError: true,
      };
    }

    const { filePath, patch } = parsed;

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        toolCallId: this.generateToolCallId(),
        content: `File not found: ${filePath}`,
        isError: true,
      };
    }

    try {
      // Read current file content
      const currentContent = await readFile(filePath, "utf-8");

      // Apply patch
      const newContent = this.applyPatch(currentContent, patch);

      // Write modified content back to file
      await writeFile(filePath, newContent, "utf-8");

      const operation = this.detectOperation(patch);
      return {
        toolCallId: this.generateToolCallId(),
        content: `Successfully edited ${filePath} (${operation})`,
        isError: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        toolCallId: this.generateToolCallId(),
        content: `Failed to edit file: ${errorMessage}`,
        isError: true,
      };
    }
  }

  /**
   * Parse and validate tool input
   */
  private parseInput(input: Record<string, unknown>): FileEditInput | null {
    const filePath = input.filePath;
    const patch = input.patch;

    if (!filePath || typeof filePath !== "string") {
      return null;
    }

    if (!patch || typeof patch !== "string") {
      return null;
    }

    return { filePath, patch };
  }

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
  private applyPatch(currentContent: string, patch: string): string {
    // Check for append operation (starts with ">>>")
    if (patch.trim().startsWith(">>>")) {
      const appendContent = patch.trim().substring(3).trim();
      return (
        currentContent +
        (currentContent && !currentContent.endsWith("\n") ? "\n" : "") +
        appendContent
      );
    }

    // Check for replacement operation (contains ">>>>")
    const separator = ">>>>";
    if (patch.includes(separator)) {
      const parts = patch.split(separator);
      if (parts.length >= 2) {
        const oldText = parts[0];
        const newText = parts.slice(1).join(separator); // Rejoin in case newText contains separator
        // Replace first occurrence
        if (oldText && currentContent.includes(oldText)) {
          return currentContent.replace(oldText, newText);
        } else {
          // Old text not found, return unchanged
          return currentContent;
        }
      }
    }

    // If no recognized operation, treat as append (fallback)
    return currentContent + (currentContent && !currentContent.endsWith("\n") ? "\n" : "") + patch;
  }

  /**
   * Detect the type of operation performed
   *
   * @param patch - Patch string
   * @returns Description of operation
   */
  private detectOperation(patch: string): string {
    if (patch.trim().startsWith(">>>")) {
      return "append operation";
    }

    if (patch.includes(">>>>")) {
      return "replacement operation";
    }

    return "text modification";
  }

  /**
   * Generate a unique tool call ID
   */
  private generateToolCallId(): string {
    return `file_edit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

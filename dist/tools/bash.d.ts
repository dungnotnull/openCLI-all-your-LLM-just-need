/**
 * Bash Tool for OpenCLI
 *
 * SECURITY-CRITICAL: This tool executes arbitrary shell commands.
 * Always shows the command to the user before execution and requires confirmation.
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Execute shell commands with optional cwd and env
 * - Show command to user before execution (permission prompt)
 * - Require user confirmation (Y/n) before execution
 * - Capture stdout and stderr
 * - Return combined output
 *
 * Sandbox Mode (optional):
 * - When enabled, commands run in a Docker container for isolation
 * - Provides security by limiting filesystem and network access
 */
import { Tool, ToolResult } from "../types/index.js";
/**
 * Bash Tool Class
 *
 * Executes shell commands with user confirmation.
 * Supports optional working directory and environment variables.
 * Can optionally use Docker sandbox for secure isolation.
 */
export declare class BashTool extends Tool {
    readonly name = "bash";
    readonly description = "Execute shell commands in the terminal";
    private sandboxMode;
    private sandbox;
    /**
     * Create a new BashTool
     *
     * @param sandboxMode - Enable Docker sandbox mode for secure command execution
     */
    constructor(sandboxMode?: boolean);
    /**
     * Enable or disable sandbox mode
     */
    setSandboxMode(enabled: boolean): void;
    readonly inputSchema: {
        type: string;
        properties: {
            command: {
                type: string;
                description: string;
            };
            cwd: {
                type: string;
                description: string;
            };
            env: {
                type: string;
                description: string;
                additionalProperties: {
                    type: string;
                };
            };
        };
        required: string[];
    };
    /**
     * Execute a shell command with user confirmation
     *
     * @param input - Tool input containing command, optional cwd, and env
     * @returns Tool result with stdout/stderr or error message
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Parse and validate tool input
     */
    private parseInput;
    /**
     * Request user confirmation via stdin
     *
     * @returns true if user confirms (Y or empty), false if user declines (n)
     */
    private requestConfirmation;
    /**
     * Execute command using child_process.spawn or sandbox
     *
     * @param command - Command string to execute
     * @param cwd - Optional working directory
     * @param env - Optional environment variables
     * @returns Combined stdout and stderr output
     */
    private executeCommand;
    /**
     * Execute command directly using child_process.spawn
     *
     * @param command - Command string to execute
     * @param cwd - Optional working directory
     * @param env - Optional environment variables
     * @returns Combined stdout and stderr output
     */
    private executeCommandDirect;
    /**
     * Combine stdout and stderr into formatted output
     */
    private combineOutput;
    /**
     * Generate a unique tool call ID
     */
    private generateToolCallId;
}
//# sourceMappingURL=bash.d.ts.map
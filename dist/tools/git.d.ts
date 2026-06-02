/**
 * Git Tool
 *
 * Performs Git operations: commit, diff, log, branch, status.
 * Allows the agent to interact with Git repositories.
 */
import { Tool, ToolResult } from '../types/index.js';
/**
 * Git Tool Class
 */
export declare class GitTool extends Tool {
    readonly name = "git";
    readonly description = "Perform Git operations (status, diff, log, commit, branch, checkout)";
    readonly inputSchema: {
        type: string;
        properties: {
            operation: {
                type: string;
                enum: string[];
                description: string;
            };
            args: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    /**
     * Execute Git operation
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Perform specific Git operation
     */
    private performOperation;
    /**
     * Get Git status
     */
    private gitStatus;
    /**
     * Get Git diff
     */
    private gitDiff;
    /**
     * Get Git log
     */
    private gitLog;
    /**
     * Create a commit
     */
    private gitCommit;
    /**
     * Stage files
     */
    private gitAdd;
    /**
     * List or create branches
     */
    private gitBranch;
    /**
     * Checkout branch or commit
     */
    private gitCheckout;
}
//# sourceMappingURL=git.d.ts.map
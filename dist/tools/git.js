/**
 * Git Tool
 *
 * Performs Git operations: commit, diff, log, branch, status.
 * Allows the agent to interact with Git repositories.
 */
import { Tool } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
const execAsync = promisify(exec);
/**
 * Git Tool Class
 */
export class GitTool extends Tool {
    name = 'git';
    description = 'Perform Git operations (status, diff, log, commit, branch, checkout)';
    inputSchema = {
        type: 'object',
        properties: {
            operation: {
                type: 'string',
                enum: ['status', 'diff', 'log', 'commit', 'add', 'branch', 'checkout'],
                description: 'The Git operation to perform',
            },
            args: {
                type: 'object',
                description: 'Operation-specific arguments',
            },
        },
        required: ['operation'],
    };
    /**
     * Execute Git operation
     */
    async execute(input) {
        if (!input.operation || typeof input.operation !== 'string') {
            return {
                toolCallId: '',
                content: 'Error: operation is required and must be a string',
                isError: true,
            };
        }
        const { operation, args = {} } = input;
        logger.info({ operation, args }, 'Executing Git operation');
        try {
            const result = await this.performOperation(operation, args);
            return {
                toolCallId: '',
                content: result,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ operation, error }, 'Git operation failed');
            return {
                toolCallId: '',
                content: `Git ${operation} failed: ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Perform specific Git operation
     */
    async performOperation(operation, args) {
        switch (operation) {
            case 'status':
                return await this.gitStatus();
            case 'diff':
                return await this.gitDiff(args);
            case 'log':
                return await this.gitLog(args);
            case 'commit':
                return await this.gitCommit(args);
            case 'add':
                return await this.gitAdd(args);
            case 'branch':
                return await this.gitBranch(args);
            case 'checkout':
                return await this.gitCheckout(args);
            default:
                throw new Error(`Unknown Git operation: ${operation}`);
        }
    }
    /**
     * Get Git status
     */
    async gitStatus() {
        const { stdout } = await execAsync('git status --short');
        return stdout || 'No changes detected.';
    }
    /**
     * Get Git diff
     */
    async gitDiff(args) {
        const target = args.target;
        const cached = args.cached;
        let cmd = 'git diff';
        if (cached)
            cmd += ' --cached';
        if (target)
            cmd += ` ${target}`;
        const { stdout } = await execAsync(cmd);
        return stdout || 'No differences.';
    }
    /**
     * Get Git log
     */
    async gitLog(args) {
        const maxCount = args.maxCount || 10;
        const oneline = args.oneline;
        let cmd = `git log -${maxCount}`;
        if (oneline)
            cmd += ' --oneline';
        const { stdout } = await execAsync(cmd);
        return stdout || 'No commits found.';
    }
    /**
     * Create a commit
     */
    async gitCommit(args) {
        const message = args.message;
        const all = args.all;
        if (!message) {
            throw new Error('Commit message is required');
        }
        let cmd = 'git commit';
        if (all)
            cmd += ' -a';
        cmd += ` -m "${message}"`;
        const { stdout, stderr } = await execAsync(cmd);
        // Commit may fail if nothing to commit
        if (stderr && stderr.includes('nothing to commit')) {
            return 'Nothing to commit.';
        }
        return stdout || stderr || 'Commit created.';
    }
    /**
     * Stage files
     */
    async gitAdd(args) {
        const files = args.files;
        if (!files) {
            throw new Error('Files argument is required');
        }
        const fileList = Array.isArray(files) ? files : [files];
        const { stdout } = await execAsync(`git add ${fileList.join(' ')}`);
        return stdout || 'Files staged.';
    }
    /**
     * List or create branches
     */
    async gitBranch(args) {
        const list = args.list;
        const create = args.create;
        const deleteBranch = args.delete;
        if (create) {
            const { stdout } = await execAsync(`git branch ${create}`);
            return `Branch '${create}' created.`;
        }
        if (deleteBranch) {
            const { stdout } = await execAsync(`git branch -d ${deleteBranch}`);
            return `Branch '${deleteBranch}' deleted.`;
        }
        // Default: list branches
        const { stdout } = await execAsync('git branch');
        return stdout || 'No branches found.';
    }
    /**
     * Checkout branch or commit
     */
    async gitCheckout(args) {
        const branch = args.branch;
        const createBranch = args.create;
        if (!branch) {
            throw new Error('Branch argument is required');
        }
        let cmd = 'git checkout';
        if (createBranch) {
            cmd += ` -b ${branch}`;
        }
        else {
            cmd += ` ${branch}`;
        }
        const { stdout, stderr } = await execAsync(cmd);
        return stdout || stderr || `Switched to '${branch}'.`;
    }
}
//# sourceMappingURL=git.js.map
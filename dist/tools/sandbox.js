/**
 * Docker Sandbox Tool
 *
 * Executes bash commands in a Docker container for secure isolation.
 * Provides a safe environment for running untrusted commands.
 *
 * This is a security feature that prevents commands from:
 * - Accessing the host filesystem
 * - Accessing the host network
 * - Accessing host environment variables
 * - Making persistent changes
 */
import { Tool } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
const execAsync = promisify(exec);
/**
 * Docker Sandbox Tool Class
 */
export class SandboxTool extends Tool {
    name = 'sandbox';
    description = 'Execute bash commands in a Docker container for secure isolation';
    inputSchema = {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The bash command to execute in the sandbox',
            },
            workdir: {
                type: 'string',
                description: 'Working directory inside the container (default: /workspace)',
            },
            timeout: {
                type: 'number',
                description: 'Execution timeout in seconds (default: 30)',
            },
        },
        required: ['command'],
    };
    config;
    containerId = null;
    constructor(config) {
        super();
        this.config = {
            enabled: true,
            imageName: 'ubuntu:22.04',
            workdir: '/workspace',
            timeout: 30,
            ...config,
        };
    }
    /**
     * Initialize the sandbox container
     */
    async initializeContainer() {
        if (this.containerId) {
            return; // Already initialized
        }
        try {
            // Check if Docker is available
            await execAsync('docker --version');
        }
        catch (error) {
            throw new Error('Docker is not installed or not accessible. Please install Docker to use sandbox mode.');
        }
        try {
            // Create a new container with the workspace directory
            const { stdout } = await execAsync(`docker create -i --rm -w ${this.config.workdir} ${this.config.imageName} tail -f /dev/null`);
            this.containerId = stdout.trim();
            logger.info({ containerId: this.containerId }, 'Sandbox container created');
            // Start the container
            await execAsync(`docker start ${this.containerId}`);
        }
        catch (error) {
            this.containerId = null;
            throw new Error(`Failed to create sandbox container: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute a command in the sandbox
     */
    async execute(input) {
        if (!this.config.enabled) {
            return {
                toolCallId: '',
                content: 'Sandbox mode is disabled. Use the bash tool instead.',
                isError: true,
            };
        }
        if (!input.command || typeof input.command !== 'string') {
            return {
                toolCallId: '',
                content: 'Error: command is required and must be a string',
                isError: true,
            };
        }
        const { command, workdir, timeout } = input;
        logger.info({ command, workdir, timeout }, 'Executing sandbox command');
        try {
            // Ensure container is initialized
            await this.initializeContainer();
            // Prepare the execution command
            const actualWorkdir = workdir || this.config.workdir || '/workspace';
            const actualTimeout = timeout || this.config.timeout || 30;
            // Execute the command in the container
            const execCmd = `docker exec -i ${this.containerId} bash -c "cd ${actualWorkdir} && ${command}"`;
            const { stdout, stderr } = await execAsync(execCmd, {
                timeout: actualTimeout * 1000,
            });
            const output = stdout || stderr || 'Command executed successfully';
            return {
                toolCallId: '',
                content: output,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ command, error }, 'Sandbox command failed');
            return {
                toolCallId: '',
                content: `Sandbox command failed: ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Copy files from host to container
     */
    async copyIn(sourcePath, destPath) {
        if (!this.containerId) {
            await this.initializeContainer();
        }
        await execAsync(`docker cp "${sourcePath}" ${this.containerId}:"${destPath}"`);
        logger.info({ sourcePath, destPath }, 'Files copied to sandbox');
    }
    /**
     * Copy files from container to host
     */
    async copyOut(sourcePath, destPath) {
        if (!this.containerId) {
            throw new Error('Container not initialized');
        }
        await execAsync(`docker cp ${this.containerId}:"${sourcePath}" "${destPath}"`);
        logger.info({ sourcePath, destPath }, 'Files copied from sandbox');
    }
    /**
     * Stop and remove the container
     */
    async cleanup() {
        if (this.containerId) {
            try {
                await execAsync(`docker stop ${this.containerId}`);
                logger.info({ containerId: this.containerId }, 'Sandbox container stopped');
            }
            catch (error) {
                logger.error({ error }, 'Failed to stop sandbox container');
            }
            this.containerId = null;
        }
    }
    /**
     * Get the container ID
     */
    getContainerId() {
        return this.containerId;
    }
    /**
     * Check if sandbox is available
     */
    async isAvailable() {
        try {
            await execAsync('docker --version');
            return true;
        }
        catch {
            return false;
        }
    }
}
/**
 * Create a sandbox tool instance
 */
export function createSandboxTool(config) {
    return new SandboxTool(config);
}
/**
 * Singleton instance for global use
 */
let globalSandbox = null;
/**
 * Get or create the global sandbox instance
 */
export function getSandbox() {
    if (!globalSandbox) {
        globalSandbox = new SandboxTool();
    }
    return globalSandbox;
}
//# sourceMappingURL=sandbox.js.map
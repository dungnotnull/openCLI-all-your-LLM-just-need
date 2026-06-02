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
import { Tool, ToolResult } from '../types/index.js';
/**
 * Sandbox configuration
 */
interface SandboxConfig {
    enabled: boolean;
    imageName?: string;
    workdir?: string;
    timeout?: number;
}
/**
 * Docker Sandbox Tool Class
 */
export declare class SandboxTool extends Tool {
    readonly name = "sandbox";
    readonly description = "Execute bash commands in a Docker container for secure isolation";
    readonly inputSchema: {
        type: string;
        properties: {
            command: {
                type: string;
                description: string;
            };
            workdir: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    private config;
    private containerId;
    constructor(config?: Partial<SandboxConfig>);
    /**
     * Initialize the sandbox container
     */
    private initializeContainer;
    /**
     * Execute a command in the sandbox
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Copy files from host to container
     */
    copyIn(sourcePath: string, destPath: string): Promise<void>;
    /**
     * Copy files from container to host
     */
    copyOut(sourcePath: string, destPath: string): Promise<void>;
    /**
     * Stop and remove the container
     */
    cleanup(): Promise<void>;
    /**
     * Get the container ID
     */
    getContainerId(): string | null;
    /**
     * Check if sandbox is available
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Create a sandbox tool instance
 */
export declare function createSandboxTool(config?: Partial<SandboxConfig>): SandboxTool;
/**
 * Get or create the global sandbox instance
 */
export declare function getSandbox(): SandboxTool;
export {};
//# sourceMappingURL=sandbox.d.ts.map
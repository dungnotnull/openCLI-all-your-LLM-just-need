/**
 * Tool Registry for OpenCLI
 *
 * Manages tool registration, schema discovery, and execution.
 * Provides centralized tool management for the agent loop.
 *
 * Per PROJECT-detail.md §4.2:
 * - Register tool instances
 * - Provide tool schemas to providers
 * - Execute tools by name with validation
 * - Handle tool execution errors
 */
import type { Tool, ToolSchema, ToolResult } from "../types/index.js";
/**
 * Tool Registry Class
 *
 * Singleton registry for managing tool instances and execution.
 * Tool names must be unique - last registration wins for duplicates.
 */
export declare class ToolRegistry {
    private static instance;
    private tools;
    private constructor();
    /**
     * Get or create the singleton ToolRegistry instance
     */
    static getInstance(): ToolRegistry;
    /**
     * Reset the singleton instance
     *
     * Creates a fresh singleton instance, discarding the previous one.
     * Useful for testing or reset scenarios.
     *
     * @returns Fresh ToolRegistry singleton instance
     */
    static resetInstance(): ToolRegistry;
    /**
     * Register a tool instance
     *
     * @param tool - Tool instance to register
     *
     * If a tool with the same name already exists, it will be replaced
     * (last registration wins for duplicates)
     */
    register(tool: Tool): void;
    /**
     * Get schemas for all registered tools
     *
     * @returns Array of tool schemas for provider consumption
     */
    getSchemas(): ToolSchema[];
    /**
     * Get a registered tool by name
     *
     * @param name - Tool name to lookup
     * @returns Tool instance or undefined if not found
     */
    getTool(name: string): Tool | undefined;
    /**
     * Execute a tool by name
     *
     * @param name - Tool name to execute
     * @param input - Tool input parameters
     * @returns Tool result with toolCallId, content, and optional error flag
     * @throws Error if tool not found or input validation fails
     */
    execute(name: string, input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * List all registered tool names
     *
     * @returns Array of tool names
     */
    listTools(): string[];
    /**
     * Generate a unique tool call ID
     *
     * @returns Unique identifier string
     */
    private generateToolCallId;
    /**
     * Unregister a tool by name
     *
     * @param name - Tool name to unregister
     * @returns true if tool was found and removed, false otherwise
     */
    unregister(name: string): boolean;
    /**
     * Clear all registered tools
     *
     * Useful for testing or reset scenarios
     */
    clear(): void;
    /**
     * Get count of registered tools
     *
     * @returns Number of registered tools
     */
    get size(): number;
}
/**
 * Reset the singleton instance (convenience export)
 *
 * Creates a fresh singleton instance, discarding the previous one.
 * Useful for testing or reset scenarios.
 *
 * @returns Fresh ToolRegistry singleton instance
 */
export declare const resetToolRegistry: () => ToolRegistry;
//# sourceMappingURL=registry.d.ts.map
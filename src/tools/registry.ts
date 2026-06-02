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
export class ToolRegistry {
  private static instance: ToolRegistry | null = null;
  private tools: Map<string, Tool>;

  private constructor() {
    this.tools = new Map();
  }

  /**
   * Get or create the singleton ToolRegistry instance
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Reset the singleton instance
   *
   * Creates a fresh singleton instance, discarding the previous one.
   * Useful for testing or reset scenarios.
   *
   * @returns Fresh ToolRegistry singleton instance
   */
  static resetInstance(): ToolRegistry {
    ToolRegistry.instance = null;
    return ToolRegistry.getInstance();
  }

  /**
   * Register a tool instance
   *
   * @param tool - Tool instance to register
   *
   * If a tool with the same name already exists, it will be replaced
   * (last registration wins for duplicates)
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get schemas for all registered tools
   *
   * @returns Array of tool schemas for provider consumption
   */
  getSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Get a registered tool by name
   *
   * @param name - Tool name to lookup
   * @returns Tool instance or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name
   *
   * @param name - Tool name to execute
   * @param input - Tool input parameters
   * @returns Tool result with toolCallId, content, and optional error flag
   * @throws Error if tool not found or input validation fails
   */
  async execute(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    // Find tool by name
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Validate input exists (basic check)
    if (!input || typeof input !== "object") {
      throw new Error(`Invalid input for tool ${name}: input must be an object`);
    }

    // Generate tool call ID if not provided in input
    const toolCallId = this.generateToolCallId();

    try {
      // Execute tool
      const result = await tool.execute(input);

      // Ensure result has toolCallId
      return {
        toolCallId: result.toolCallId || toolCallId,
        content: result.content,
        isError: result.isError,
      };
    } catch (error) {
      // Handle execution errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        toolCallId,
        content: `Tool execution error: ${errorMessage}`,
        isError: true,
      };
    }
  }

  /**
   * List all registered tool names
   *
   * @returns Array of tool names
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Generate a unique tool call ID
   *
   * @returns Unique identifier string
   */
  private generateToolCallId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Unregister a tool by name
   *
   * @param name - Tool name to unregister
   * @returns true if tool was found and removed, false otherwise
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all registered tools
   *
   * Useful for testing or reset scenarios
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Get count of registered tools
   *
   * @returns Number of registered tools
   */
  get size(): number {
    return this.tools.size;
  }
}

/**
 * Reset the singleton instance (convenience export)
 *
 * Creates a fresh singleton instance, discarding the previous one.
 * Useful for testing or reset scenarios.
 *
 * @returns Fresh ToolRegistry singleton instance
 */
export const resetToolRegistry = () => ToolRegistry.resetInstance();

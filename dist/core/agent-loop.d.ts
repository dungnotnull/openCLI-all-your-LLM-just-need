/**
 * Async Generator Agent Loop for OpenCLI
 *
 * Implements the core agent conversation loop as an async generator.
 * Yields AgentEvent objects for streaming responses, tool calls, and completion.
 *
 * Per PROJECT-detail.md §4.1:
 * - Takes user task and session state
 * - Compresses context (Phase 1: no compression, use all messages)
 * - Calls provider.chat() with messages and tool schemas
 * - Streams Delta events as AgentEvents
 * - Executes tools synchronously within loop
 * - Appends all messages and tool results to session
 */
import type { ToolResult, Delta, AgentEvent, ModelProvider, Session, ToolSchema } from "../types/index.js";
/**
 * Tool Registry Interface
 *
 * Provides tool schema discovery and execution capabilities.
 * Will be implemented in Phase 1 Task 20.
 */
export interface ToolRegistry {
    /**
     * Get all available tool schemas for the provider
     */
    getSchemas(): ToolSchema[];
    /**
     * Execute a tool call by name
     * @param name - Tool name
     * @param input - Tool input parameters
     * @returns Tool result with content and optional error flag
     */
    execute(name: string, input: Record<string, unknown>): Promise<ToolResult>;
}
/**
 * Agent Loop Configuration Options
 */
export interface AgentLoopOptions {
    /**
     * Maximum number of iterations before forcing completion
     * Default: 10 (prevents infinite loops)
     */
    maxIterations?: number;
    /**
     * Enable thinking mode (if supported by provider)
     * Default: false
     */
    enableThinking?: boolean;
    /**
     * Temperature for model responses
     * Default: 0.7
     */
    temperature?: number;
    /**
     * Maximum tokens per response
     * Default: provider-specific
     */
    maxTokens?: number;
}
/**
 * Core Agent Loop Function
 *
 * Async generator that manages the multi-turn conversation between
 * user, model, and tools. Yields events for UI streaming and progress tracking.
 *
 * @param task - User's task/instruction to process
 * @param session - Current session state (messages, metadata)
 * @param provider - Model provider for chat completions
 * @param tools - Tool registry for schema and execution
 * @param options - Optional loop configuration
 * @returns AsyncGenerator yielding AgentEvent objects
 *
 * @example
 * ```typescript
 * for await (const event of agentLoop(task, session, provider, tools)) {
 *   if (event.type === 'delta') {
 *     processStreamedContent(event.data as string);
 *   } else if (event.type === 'tool_call') {
 *     showToolCall(event.data as ToolCall);
 *   }
 * }
 * ```
 */
export declare function agentLoop(task: string, session: Session, provider: ModelProvider, tools: ToolRegistry, options?: AgentLoopOptions): AsyncGenerator<AgentEvent>;
/**
 * Check if a delta stream contains any tool calls
 *
 * Utility function to inspect a stream without consuming it.
 * Note: This requires the stream to be replayable or cached.
 *
 * @param deltas - Array of deltas to inspect
 * @returns True if any delta is a tool_call
 */
export declare function hasToolCallsInDeltas(deltas: Delta[]): boolean;
/**
 * Extract final content from a series of content deltas
 *
 * @param deltas - Array of deltas to process
 * @returns Concatenated content string
 */
export declare function extractContentFromDeltas(deltas: Delta[]): string;
//# sourceMappingURL=agent-loop.d.ts.map
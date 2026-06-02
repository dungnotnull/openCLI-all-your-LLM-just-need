/**
 * Session Memory Management for OpenCLI
 *
 * Implements in-memory session management with persistence capabilities.
 * Sessions are stored in ~/.opencli/sessions/ for cross-session continuity.
 */
import type { Session, Message, ToolResult, ModelProvider, ModelDescriptor, CompressionStrategy, CompressionMetrics } from "../types/index.js";
/**
 * Compression history record
 */
interface CompressionRecord {
    timestamp: Date;
    beforeTokens: number;
    afterTokens: number;
    reduction: number;
    reductionPercent: number;
    mode: string;
}
/**
 * Session Manager Class
 *
 * Manages individual chat sessions with message history, tool calls,
 * and persistence capabilities for restoring sessions across CLI invocations.
 */
export declare class SessionManager implements Session {
    readonly id: string;
    messages: Message[];
    readonly provider: ModelProvider;
    readonly model: ModelDescriptor;
    readonly createdAt: Date;
    updatedAt: Date;
    /**
     * Compression history for this session
     */
    private compressionHistory;
    /**
     * Custom compression strategy override
     * If set, this takes precedence over the default provider strategy
     */
    private customCompressionStrategy?;
    /**
     * Create a new session
     * @param provider - The model provider to use for this session
     * @param model - The specific model descriptor
     * @param existingSession - Optional existing session data for loading saved sessions
     */
    constructor(provider: ModelProvider, model: ModelDescriptor, existingSession?: Partial<Session>);
    /**
     * Append a message to the session
     * @param message - The message to add
     */
    appendMessage(message: Message): void;
    /**
     * Append a tool result message to the session
     * @param toolCallId - The ID of the tool call this result corresponds to
     * @param result - The tool result to add
     */
    appendToolResult(toolCallId: string, result: ToolResult): void;
    /**
     * Check if the session is complete
     * A session is complete when the last assistant message has stopReason 'end_turn'
     *
     * For Phase 1, this is a simplified check that will be enhanced when agent loop is implemented
     */
    isComplete(): boolean;
    /**
     * Compress session messages if token count exceeds budget
     *
     * This method should be called before each API call to ensure the context
     * fits within the model's context window. It uses the provider's default
     * compression strategy unless a custom strategy was set.
     *
     * @returns CompressionMetrics if compression occurred, undefined otherwise
     */
    compressIfNeeded(): Promise<CompressionMetrics | undefined>;
    /**
     * Set a custom compression strategy for this session
     *
     * Use this to override the default provider-specific strategy.
     * Useful for testing or fine-tuned control over compression behavior.
     *
     * @param strategy - The custom compression strategy to use
     */
    setCompressionStrategy(strategy: CompressionStrategy): void;
    /**
     * Get the compression history for this session
     *
     * @returns Array of compression records, oldest first
     */
    getCompressionHistory(): CompressionRecord[];
    /**
     * Get total tokens saved through compression
     *
     * @returns Total number of tokens saved across all compressions
     */
    getTotalTokensSaved(): number;
    /**
     * Serialize session to JSON for persistence
     * @returns JSON-serializable object representing the session
     */
    serialize(): Record<string, unknown>;
    /**
     * Deserialize session from JSON
     * @param data - The JSON data to deserialize
     * @param provider - The model provider (required for reconstruction)
     * @param model - The model descriptor (required for reconstruction)
     * @returns A new SessionManager instance with restored data
     */
    static deserialize(data: Record<string, unknown>, provider: ModelProvider, model: ModelDescriptor): SessionManager;
}
export {};
//# sourceMappingURL=session-memory.d.ts.map
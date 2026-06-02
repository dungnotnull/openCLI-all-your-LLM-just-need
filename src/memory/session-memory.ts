/**
 * Session Memory Management for OpenCLI
 *
 * Implements in-memory session management with persistence capabilities.
 * Sessions are stored in ~/.opencli/sessions/ for cross-session continuity.
 */

import type {
  Session,
  Message,
  ToolResult,
  ModelProvider,
  ModelDescriptor,
  CompressionStrategy,
  CompressionMetrics,
} from "../types/index.js";
import { compressSession, getDefaultCompressionStrategy } from "../core/compressor.js";
import { countMessageTokens } from "../core/tokenizer.js";
import { costTracker } from "../cost/tracker.js";

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
export class SessionManager implements Session {
  readonly id: string;
  messages: Message[] = [];
  readonly provider: ModelProvider;
  readonly model: ModelDescriptor;
  readonly createdAt: Date;
  updatedAt: Date;

  /**
   * Compression history for this session
   */
  private compressionHistory: CompressionRecord[] = [];

  /**
   * Custom compression strategy override
   * If set, this takes precedence over the default provider strategy
   */
  private customCompressionStrategy?: CompressionStrategy;

  /**
   * Create a new session
   * @param provider - The model provider to use for this session
   * @param model - The specific model descriptor
   * @param existingSession - Optional existing session data for loading saved sessions
   */
  constructor(provider: ModelProvider, model: ModelDescriptor, existingSession?: Partial<Session>) {
    // Generate unique ID using Node.js native crypto (available in Node 20+)
    this.id = existingSession?.id || crypto.randomUUID();

    // Restore messages if loading from disk
    this.messages = existingSession?.messages || [];

    this.provider = provider;
    this.model = model;

    // Use existing timestamps or create new ones
    this.createdAt = existingSession?.createdAt ? new Date(existingSession.createdAt) : new Date();

    this.updatedAt = existingSession?.updatedAt ? new Date(existingSession.updatedAt) : new Date();
  }

  /**
   * Append a message to the session
   * @param message - The message to add
   */
  appendMessage(message: Message): void {
    this.messages.push(message);
    this.updatedAt = new Date();
  }

  /**
   * Append a tool result message to the session
   * @param toolCallId - The ID of the tool call this result corresponds to
   * @param result - The tool result to add
   */
  appendToolResult(toolCallId: string, result: ToolResult): void {
    const toolMessage: Message = {
      role: "tool",
      toolCallId,
      content: result.content,
    };

    // Note: isError field is part of ToolResult, not Message interface
    // When we need to track tool errors, we can prepend "[ERROR]" to content
    // or extend Message interface in future phases
    if (result.isError) {
      toolMessage.content = `[ERROR] ${result.content}`;
    }

    this.messages.push(toolMessage);
    this.updatedAt = new Date();
  }

  /**
   * Check if the session is complete
   * A session is complete when the last assistant message has stopReason 'end_turn'
   *
   * For Phase 1, this is a simplified check that will be enhanced when agent loop is implemented
   */
  isComplete(): boolean {
    if (this.messages.length === 0) {
      return false;
    }

    const lastMessage = this.messages[this.messages.length - 1];
    if (!lastMessage) {
      return false;
    }

    // Check if last message is from assistant and indicates completion
    // Note: stopReason will be added to assistant messages when agent loop is implemented
    const hasStopReason = "stopReason" in lastMessage;
    if (hasStopReason) {
      return (
        lastMessage.role === "assistant" &&
        (lastMessage as { stopReason?: string }).stopReason === "end_turn"
      );
    }

    // For now, sessions are considered incomplete until agent loop adds stopReason
    return false;
  }

  /**
   * Compress session messages if token count exceeds budget
   *
   * This method should be called before each API call to ensure the context
   * fits within the model's context window. It uses the provider's default
   * compression strategy unless a custom strategy was set.
   *
   * @returns CompressionMetrics if compression occurred, undefined otherwise
   */
  async compressIfNeeded(): Promise<CompressionMetrics | undefined> {
    // Get compression strategy (custom or default)
    const strategy = this.customCompressionStrategy || getDefaultCompressionStrategy(
      this.provider.id,
      this.model.contextWindow
    );

    // Count current tokens
    const currentTokens = await countMessageTokens(this.provider.id, this.messages);

    // If under budget, no compression needed
    if (currentTokens <= strategy.maxTokenBudget) {
      return undefined;
    }

    // Compress the session
    const before = this.messages;
    const after = await compressSession(this.messages, this.provider.id, strategy);

    // Update messages if compression changed anything
    if (after.length < before.length) {
      this.messages = after;
      this.updatedAt = new Date();

      // Calculate compression metrics
      const afterTokens = await countMessageTokens(this.provider.id, after);
      const reduction = currentTokens - afterTokens;
      const reductionPercent = (reduction / currentTokens) * 100;

      const metrics: CompressionRecord = {
        timestamp: new Date(),
        beforeTokens: currentTokens,
        afterTokens,
        reduction,
        reductionPercent,
        mode: strategy.pruningMode,
      };

      this.compressionHistory.push(metrics);

      // Log compression event to cost tracker
      costTracker.trackCompression(currentTokens, afterTokens, strategy.pruningMode);

      return {
        beforeTokens: currentTokens,
        afterTokens,
        reduction,
        reductionPercent,
        mode: strategy.pruningMode,
      };
    }

    return undefined;
  }

  /**
   * Set a custom compression strategy for this session
   *
   * Use this to override the default provider-specific strategy.
   * Useful for testing or fine-tuned control over compression behavior.
   *
   * @param strategy - The custom compression strategy to use
   */
  setCompressionStrategy(strategy: CompressionStrategy): void {
    this.customCompressionStrategy = strategy;
  }

  /**
   * Get the compression history for this session
   *
   * @returns Array of compression records, oldest first
   */
  getCompressionHistory(): CompressionRecord[] {
    return [...this.compressionHistory];
  }

  /**
   * Get total tokens saved through compression
   *
   * @returns Total number of tokens saved across all compressions
   */
  getTotalTokensSaved(): number {
    return this.compressionHistory.reduce((sum, record) => sum + record.reduction, 0);
  }

  /**
   * Serialize session to JSON for persistence
   * @returns JSON-serializable object representing the session
   */
  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      messages: this.messages,
      provider: this.provider.id,
      model: this.model.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize session from JSON
   * @param data - The JSON data to deserialize
   * @param provider - The model provider (required for reconstruction)
   * @param model - The model descriptor (required for reconstruction)
   * @returns A new SessionManager instance with restored data
   */
  static deserialize(
    data: Record<string, unknown>,
    provider: ModelProvider,
    model: ModelDescriptor
  ): SessionManager {
    return new SessionManager(provider, model, {
      id: data.id as string,
      messages: data.messages as Message[],
      createdAt: data.createdAt ? new Date(data.createdAt as string) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : undefined,
    });
  }
}

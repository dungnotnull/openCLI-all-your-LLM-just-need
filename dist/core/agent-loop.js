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
/**
 * Default agent loop options
 */
const DEFAULT_OPTIONS = {
    maxIterations: 10,
    enableThinking: false,
    temperature: 0.7,
    maxTokens: 4096,
};
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
export async function* agentLoop(task, session, provider, tools, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    // Step 1: Add user task as a message to session
    const userMessage = {
        role: "user",
        content: task,
    };
    session.appendMessage(userMessage);
    // Step 2: Main conversation loop
    let iteration = 0;
    while (!session.isComplete() && iteration < opts.maxIterations) {
        iteration++;
        try {
            // Step 2a: Compress context if needed
            // This ensures the session messages fit within the model's context window
            const compressionMetrics = await session.compressIfNeeded();
            if (compressionMetrics) {
                // Log compression event for monitoring
                yield {
                    type: "compression",
                    data: compressionMetrics,
                };
            }
            const messages = session.messages;
            // Step 2b: Prepare chat options
            const chatOptions = {
                tools: tools.getSchemas(),
                temperature: opts.temperature,
                maxTokens: opts.maxTokens,
                enableThinking: opts.enableThinking,
                retainChainOfThought: opts.enableThinking,
            };
            // Step 2c: Call provider and stream deltas
            const stream = provider.chat(messages, chatOptions);
            // Track current assistant message being built
            let assistantContent = "";
            const assistantToolCalls = [];
            let hasToolCalls = false;
            // Step 2c: Process each delta from the stream
            for await (const delta of stream) {
                switch (delta.type) {
                    case "content":
                        // Accumulate content for final message
                        if (delta.content) {
                            assistantContent += delta.content;
                            // Yield delta event for UI streaming
                            yield {
                                type: "delta",
                                data: delta.content,
                            };
                        }
                        break;
                    case "tool_call":
                        // Track tool call for execution
                        if (delta.toolCall) {
                            assistantToolCalls.push(delta.toolCall);
                            hasToolCalls = true;
                            // Yield tool call event for UI
                            yield {
                                type: "tool_call",
                                data: delta.toolCall,
                            };
                            // Execute tool immediately (synchronous within loop)
                            try {
                                const result = await tools.execute(delta.toolCall.name, delta.toolCall.input);
                                // Append tool result to session
                                session.appendToolResult(delta.toolCall.id, result);
                                // Yield tool result event for UI
                                yield {
                                    type: "tool_result",
                                    data: result,
                                };
                            }
                            catch (error) {
                                // Tool execution failed - add error result
                                const errorResult = {
                                    toolCallId: delta.toolCall.id,
                                    content: error instanceof Error ? error.message : String(error),
                                    isError: true,
                                };
                                session.appendToolResult(delta.toolCall.id, errorResult);
                                yield {
                                    type: "tool_result",
                                    data: errorResult,
                                };
                            }
                        }
                        break;
                    case "done":
                        // Stream completed - break delta processing
                        break;
                }
            }
            // Step 2d: Append assistant message to session
            const assistantMessage = {
                role: "assistant",
                content: assistantContent,
            };
            // Add tool calls if any were made
            if (hasToolCalls) {
                assistantMessage.toolCalls = assistantToolCalls;
            }
            session.appendMessage(assistantMessage);
            // Check if we should continue looping
            // - If no tool calls were made, conversation is complete
            // - If session.isComplete() returns true, stop
            if (!hasToolCalls) {
                // Mark session as complete by appending a synthetic completion marker
                // In future phases, this might come from provider's stopReason
                yield {
                    type: "complete",
                    data: {
                        reason: "end_turn",
                        iterations: iteration,
                    },
                };
                break;
            }
        }
        catch (error) {
            // Handle provider or execution errors
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            yield {
                type: "error",
                data: {
                    message: errorMessage,
                    iteration,
                    recoverable: iteration < opts.maxIterations,
                },
            };
            // For unrecoverable errors, break the loop
            if (iteration >= opts.maxIterations) {
                yield {
                    type: "complete",
                    data: {
                        reason: "max_iterations_exceeded",
                        iterations: iteration,
                    },
                };
                break;
            }
            // For recoverable errors, continue to next iteration
            // The error message is already in the event stream
            continue;
        }
    }
    // Final completion event if loop exited naturally
    if (iteration >= opts.maxIterations && !session.isComplete()) {
        yield {
            type: "complete",
            data: {
                reason: "max_iterations_reached",
                iterations: iteration,
            },
        };
    }
}
/**
 * Check if a delta stream contains any tool calls
 *
 * Utility function to inspect a stream without consuming it.
 * Note: This requires the stream to be replayable or cached.
 *
 * @param deltas - Array of deltas to inspect
 * @returns True if any delta is a tool_call
 */
export function hasToolCallsInDeltas(deltas) {
    return deltas.some((delta) => delta.type === "tool_call" && delta.toolCall !== undefined);
}
/**
 * Extract final content from a series of content deltas
 *
 * @param deltas - Array of deltas to process
 * @returns Concatenated content string
 */
export function extractContentFromDeltas(deltas) {
    return deltas
        .filter((delta) => delta.type === "content" && delta.content)
        .map((delta) => delta.content)
        .join("");
}
//# sourceMappingURL=agent-loop.js.map
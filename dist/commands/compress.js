/**
 * Compression Command Handler for /compress Slash Command
 *
 * Allows users to manually trigger compression and view compression statistics.
 * Usage:
 *   /compress                    - Show current compression stats
 *   /compress force              - Force compression even if under budget
 *   /compress reset              - Reset compression history
 *   /compress strategy <name>    - Change compression strategy (sliding/semantic/adaptive)
 */
import { costTracker } from '../cost/tracker.js';
/**
 * Handle /compress slash command
 *
 * @param session - Current session
 * @param options - Command options
 * @returns Human-readable response message
 */
export async function handleCompressCommand(session, options = {}) {
    // Handle reset option
    if (options.reset) {
        const compressionHistory = costTracker.getCompressionHistory();
        const tokensSaved = costTracker.getTotalTokensSaved();
        costTracker.reset();
        return `✓ Compression history reset.
Previously saved ${tokensSaved} tokens across ${compressionHistory.length} compressions.`;
    }
    // Handle strategy change
    if (options.strategy) {
        const validStrategies = ['sliding', 'semantic', 'adaptive'];
        if (!validStrategies.includes(options.strategy)) {
            return `❌ Invalid strategy: ${options.strategy}
Valid strategies: ${validStrategies.join(', ')}`;
        }
        // Update session compression strategy
        if ('setCompressionStrategy' in session) {
            session.setCompressionStrategy({
                maxTokenBudget: Math.floor(session.model.contextWindow * 0.8),
                priorityWeights: {
                    systemPrompt: 1.0,
                    currentTask: 1.0,
                    recentTools: 0.9,
                    oldToolResults: 0.3,
                    oldConversation: 0.1,
                },
                episodicReconstruction: false,
                pruningMode: options.strategy,
            });
            return `✓ Compression strategy set to: ${options.strategy}`;
        }
        return `❌ Session does not support custom compression strategies`;
    }
    // Handle force compression
    if (options.force) {
        const beforeLength = session.messages.length;
        // Force compression by setting a very low budget
        if ('setCompressionStrategy' in session) {
            session.setCompressionStrategy({
                maxTokenBudget: 100, // Very low to force compression
                priorityWeights: {
                    systemPrompt: 1.0,
                    currentTask: 1.0,
                    recentTools: 0.9,
                    oldToolResults: 0.3,
                    oldConversation: 0.1,
                },
                episodicReconstruction: false,
                pruningMode: 'sliding',
            });
        }
        // Trigger compression
        if ('compressIfNeeded' in session) {
            const metrics = await session.compressIfNeeded();
            if (!metrics) {
                return `Session already under budget (${beforeLength} messages). No compression needed.`;
            }
            return `✓ Compression forced:
Before: ${metrics.beforeTokens} tokens (${beforeLength} messages)
After: ${metrics.afterTokens} tokens (${session.messages.length} messages)
Saved: ${metrics.reduction} tokens (${metrics.reductionPercent.toFixed(2)}%)
Mode: ${metrics.mode}`;
        }
        return `❌ Session does not support compression`;
    }
    // Default: show compression statistics
    return formatCompressionStats(session);
}
/**
 * Format compression statistics for display
 *
 * @param session - Current session
 * @returns Formatted statistics message
 */
function formatCompressionStats(session) {
    const compressionCount = costTracker.getCompressionCount();
    const totalTokensSaved = costTracker.getTotalTokensSaved();
    const compressionHistory = costTracker.getCompressionHistory();
    // Count tokens in current session
    const currentMessageCount = session.messages.length;
    const contextWindow = session.model.contextWindow;
    const budgetPercent = ((currentMessageCount / contextWindow) * 100).toFixed(1);
    let output = `📊 Compression Statistics

Session Context:
• Current messages: ${currentMessageCount}
• Context window: ${contextWindow} tokens
• Usage: ${budgetPercent}% of context window

Compression History:
• Events tracked: ${compressionCount}
• Total tokens saved: ${totalTokensSaved}`;
    if (compressionHistory.length > 0) {
        const lastCompression = compressionHistory[compressionHistory.length - 1];
        output += `

Last Compression:
• Mode: ${lastCompression.mode}
• Before: ${lastCompression.beforeTokens} tokens
• After: ${lastCompression.afterTokens} tokens
• Saved: ${lastCompression.reduction} tokens (${lastCompression.reductionPercent.toFixed(2)}%)
• Time: ${new Date(lastCompression.timestamp).toLocaleTimeString()}`;
    }
    if (compressionCount === 0) {
        output += `

No compression events yet. Context is within budget.`;
    }
    return output;
}
//# sourceMappingURL=compress.js.map
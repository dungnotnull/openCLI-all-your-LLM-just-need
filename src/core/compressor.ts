/**
 * Context compression engine
 * Implements sliding-window, semantic, and adaptive compression
 * Inspired by ACON and SWE-Pruner research
 */

import type { Message, CompressionStrategy, CompressionMetrics } from '../types/index.js';
import { countMessageTokens } from './tokenizer.js';

export { CompressionStrategy, CompressionMetrics } from '../types/index.js';

/**
 * Compress session messages to fit within token budget
 */
export async function compressSession(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  // Count total tokens
  const totalTokens = await countMessageTokens(providerId, messages);

  // If under budget, return as-is
  if (totalTokens <= strategy.maxTokenBudget) {
    return messages;
  }

  // Apply compression based on mode
  switch (strategy.pruningMode) {
    case 'sliding':
      return slidingWindowCompression(messages, providerId, strategy);
    case 'semantic':
      return semanticCompression(messages, providerId, strategy);
    case 'adaptive':
      return adaptiveCompression(messages, providerId, strategy);
    default:
      // Ensure we always return something
      return messages;
  }
}

/**
 * Sliding window compression - keep recent messages
 */
async function slidingWindowCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  const result: Message[] = [];
  let currentTokens = 0;

  // Always keep system prompt
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
    currentTokens += await countMessageTokens(providerId, [systemMessage]);
  }

  // Add messages from newest to oldest until budget is reached
  const nonSystemMessages = messages.filter(m => m.role !== 'system').reverse();

  for (const message of nonSystemMessages) {
    const messageTokens = await countMessageTokens(providerId, [message]);

    if (currentTokens + messageTokens > strategy.maxTokenBudget) {
      break;
    }

    result.push(message);
    currentTokens += messageTokens;
  }

  // Reverse back to chronological order (excluding system which stays first)
  const userMessages = result.slice(1).reverse();
  if (systemMessage) {
    return [systemMessage, ...userMessages];
  }
  return userMessages;
}

/**
 * Semantic compression - compress old tool results into summaries
 */
async function semanticCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  const result: Message[] = [];
  let currentTokens = 0;

  // Always keep system prompt
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
    currentTokens += await countMessageTokens(providerId, [systemMessage]);
  }

  // Separate messages by type
  const toolResults = messages.filter(m => m.role === 'tool');
  const conversation = messages.filter(m => m.role !== 'system' && m.role !== 'tool');

  // Add recent conversation (keep most of it)
  for (const message of conversation.slice(-10)) {
    const messageTokens = await countMessageTokens(providerId, [message]);

    if (currentTokens + messageTokens > strategy.maxTokenBudget * strategy.priorityWeights.currentTask) {
      break;
    }

    result.push(message);
    currentTokens += messageTokens;
  }

  // Summarize old tool results
  if (toolResults.length > 0) {
    const summary = createToolResultSummary(toolResults);
    const summaryTokens = await countMessageTokens(providerId, [summary]);

    if (currentTokens + summaryTokens < strategy.maxTokenBudget * strategy.priorityWeights.oldToolResults) {
      result.push(summary);
      currentTokens += summaryTokens;
    }
  }

  return result;
}

/**
 * Adaptive compression - choose strategy based on content type
 */
async function adaptiveCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  // Analyze message composition
  const toolResultRatio = messages.filter(m => m.role === 'tool').length / messages.length;

  // If many tool results, use semantic compression
  if (toolResultRatio > 0.3) {
    return semanticCompression(messages, providerId, strategy);
  }

  // Otherwise, use sliding window
  return slidingWindowCompression(messages, providerId, strategy);
}

/**
 * Create a summary of tool results
 */
function createToolResultSummary(toolResults: Message[]): Message {
  const successCount = toolResults.filter(m => !m.content.includes('[ERROR]')).length;
  const errorCount = toolResults.length - successCount;

  const summary = `[Summary: ${toolResults.length} tool executions — ${successCount} succeeded, ${errorCount} failed]`;

  return {
    role: 'system',
    content: summary,
  };
}

/**
 * Calculate compression metrics
 */
export async function calculateCompressionMetrics(
  before: Message[],
  after: Message[],
  providerId: string
): Promise<CompressionMetrics> {
  const beforeTokens = await countMessageTokens(providerId, before);
  const afterTokens = await countMessageTokens(providerId, after);
  const reduction = beforeTokens - afterTokens;
  const reductionPercent = (reduction / beforeTokens) * 100;

  return {
    beforeTokens,
    afterTokens,
    reduction,
    reductionPercent,
    mode: 'sliding',
  };
}

/**
 * Get default compression strategy for a provider
 */
export function getDefaultCompressionStrategy(
  providerId: string,
  contextWindow: number
): CompressionStrategy {
  // Use 80% of context window as budget
  const maxTokenBudget = Math.floor(contextWindow * 0.8);

  // Special handling for Devstral (32K - most aggressive)
  if (providerId === 'devstral') {
    return {
      maxTokenBudget: Math.floor(contextWindow * 0.5), // More aggressive
      priorityWeights: {
        systemPrompt: 1.0,
        currentTask: 1.0,
        recentTools: 0.9,
        oldToolResults: 0.2, // Lower priority
        oldConversation: 0.1,
      },
      episodicReconstruction: false,
      pruningMode: 'adaptive',
    };
  }

  // Minimax (1M - rarely needs compression)
  if (providerId === 'minimax') {
    return {
      maxTokenBudget: Math.floor(contextWindow * 0.95), // Less aggressive
      priorityWeights: {
        systemPrompt: 1.0,
        currentTask: 1.0,
        recentTools: 0.9,
        oldToolResults: 0.5,
        oldConversation: 0.3,
      },
      episodicReconstruction: true,
      pruningMode: 'semantic',
    };
  }

  // Default strategy
  return {
    maxTokenBudget,
    priorityWeights: {
      systemPrompt: 1.0,
      currentTask: 1.0,
      recentTools: 0.9,
      oldToolResults: 0.3,
      oldConversation: 0.1,
    },
    episodicReconstruction: false,
    pruningMode: 'sliding',
  };
}

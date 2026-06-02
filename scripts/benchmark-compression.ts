#!/usr/bin/env node

/**
 * Compression Benchmark Script
 *
 * Tests compression accuracy across different modes and providers.
 * Measures:
 * - Token reduction effectiveness
 * - System prompt preservation
 * - Tool result preservation
 * - Recent message preservation
 *
 * Usage:
 *   node scripts/benchmark-compression.ts
 */

import { compressSession, getDefaultCompressionStrategy, type CompressionStrategy } from '../src/core/compressor.js';
import { countTokens } from '../src/core/tokenizer.js';
import type { Message } from '../src/types/index.js';

// Sample messages for benchmarking
const createSampleMessages = (): Message[] => {
  const messages: Message[] = [];

  // System prompt
  messages.push({
    role: 'system',
    content: 'You are a helpful coding assistant with expertise in TypeScript, Python, and system architecture.',
  });

  // Task description
  messages.push({
    role: 'user',
    content: 'I need help implementing a REST API with Node.js and Express. The API should handle user authentication, CRUD operations for resources, and proper error handling.',
  });

  // Assistant response
  messages.push({
    role: 'assistant',
    content: 'I\'ll help you build a REST API with Express. Let\'s start by setting up the project structure and implementing the core functionality step by step.',
  });

  // User clarification
  messages.push({
    role: 'user',
    content: 'That sounds good. Can you also include rate limiting and request validation middleware?',
  });

  // Tool call
  messages.push({
    role: 'assistant',
    content: '',
    toolCalls: [
      {
        id: 'call_1',
        name: 'search',
        input: { query: 'express rate limiting middleware best practices' },
      },
    ],
  });

  // Tool result
  messages.push({
    role: 'tool',
    content: 'Found 5 relevant articles. Key recommendations: use express-rate-limit for basic rate limiting, implement custom rate limiting for advanced use cases, and always validate request schemas.',
    toolCallId: 'call_1',
  });

  // Continue with more conversation
  for (let i = 0; i < 20; i++) {
    messages.push({
      role: 'user',
      content: `What about database integration? Should I use PostgreSQL or MongoDB for my use case? Message ${i}`,
    });

    messages.push({
      role: 'assistant',
      content: `For your REST API, I'd recommend PostgreSQL for relational data with ACID compliance, or MongoDB if you need flexible schemas. Both have excellent Node.js drivers. Response ${i}`,
    });
  }

  // Add some more tool results
  messages.push({
    role: 'assistant',
    content: '',
    toolCalls: [
      {
        id: 'call_2',
        name: 'search',
        input: { query: 'node.js postgresql vs mongodb comparison 2024' },
      },
    ],
  });

  messages.push({
    role: 'tool',
    content: 'Comparison: PostgreSQL wins for complex queries and transactions, MongoDB is better for horizontal scaling and flexible schemas. Consider your data structure and consistency requirements.',
    toolCallId: 'call_2',
  });

  return messages;
};

interface BenchmarkResult {
  mode: string;
  providerId: string;
  contextWindow: number;
  beforeTokens: number;
  afterTokens: number;
  reduction: number;
  reductionPercent: number;
  systemPromptPreserved: boolean;
  toolResultsCount: number;
  recentMessagesCount: number;
  duration: number;
}

async function runBenchmark(
  providerId: string,
  contextWindow: number,
  strategy: CompressionStrategy
): Promise<BenchmarkResult> {
  const messages = createSampleMessages();

  // Count tokens before compression
  const startTime = Date.now();
  const beforeTokens = await countTokens(providerId, messages.join(''));

  // Compress
  const compressed = await compressSession(messages, providerId, strategy);

  // Count tokens after compression
  const afterTokens = await countTokens(providerId, compressed.join(''));

  const duration = Date.now() - startTime;

  // Check preservation
  const systemPromptPreserved = compressed.some(m => m.role === 'system');
  const toolResultsCount = compressed.filter(m => m.role === 'tool').length;
  const recentMessagesCount = compressed.slice(-5).length;

  const reduction = beforeTokens - afterTokens;
  const reductionPercent = (reduction / beforeTokens) * 100;

  return {
    mode: strategy.pruningMode,
    providerId,
    contextWindow,
    beforeTokens,
    afterTokens,
    reduction,
    reductionPercent,
    systemPromptPreserved,
    toolResultsCount,
    recentMessagesCount,
    duration,
  };
}

async function runAllBenchmarks(): Promise<void> {
  console.log('🧪 Compression Benchmark Suite\n');
  console.log('Testing compression accuracy across different providers and modes...\n');

  const providers = [
    { id: 'deepseek', contextWindow: 64000 },
    { id: 'qwen', contextWindow: 32000 },
    { id: 'devstral', contextWindow: 32000 },
    { id: 'minimax', contextWindow: 1000000 },
  ];

  const modes: Array<'sliding' | 'semantic' | 'adaptive'> = ['sliding', 'semantic', 'adaptive'];

  const results: BenchmarkResult[] = [];

  for (const provider of providers) {
    for (const mode of modes) {
      const strategy: CompressionStrategy = {
        maxTokenBudget: Math.floor(provider.contextWindow * 0.3), // Use 30% to force compression
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: mode,
      };

      console.log(`Running benchmark: ${provider.id} (${provider.contextWindow} tokens) - ${mode} mode...`);

      const result = await runBenchmark(provider.id, provider.contextWindow, strategy);
      results.push(result);

      console.log(`  ✓ Reduced ${result.beforeTokens} → ${result.afterTokens} tokens (${result.reductionPercent.toFixed(1)}%)`);
    }
  }

  console.log('\n📊 Benchmark Results Summary\n');

  // Group by mode for comparison
  const byMode = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    if (!byMode.has(result.mode)) {
      byMode.set(result.mode, []);
    }
    byMode.get(result.mode)!.push(result);
  }

  for (const [mode, modeResults] of byMode) {
    console.log(`${mode.toUpperCase()} Mode:`);

    const avgReduction = modeResults.reduce((sum, r) => sum + r.reductionPercent, 0) / modeResults.length;
    const avgDuration = modeResults.reduce((sum, r) => sum + r.duration, 0) / modeResults.length;
    const systemPreserved = modeResults.filter(r => r.systemPromptPreserved).length;
    const avgToolResults = modeResults.reduce((sum, r) => sum + r.toolResultsCount, 0) / modeResults.length;

    console.log(`  Average Token Reduction: ${avgReduction.toFixed(1)}%`);
    console.log(`  Average Duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`  System Prompt Preserved: ${systemPreserved}/${modeResults.length}`);
    console.log(`  Average Tool Results: ${avgToolResults.toFixed(1)}`);
    console.log('');
  }

  // Overall statistics
  const totalReduction = results.reduce((sum, r) => sum + r.reductionPercent, 0) / results.length;
  const totalSystemPreserved = results.filter(r => r.systemPromptPreserved).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log('OVERALL STATISTICS:');
  console.log(`  Average Token Reduction: ${totalReduction.toFixed(1)}%`);
  console.log(`  Average Duration: ${totalDuration.toFixed(0)}ms`);
  console.log(`  System Prompt Preservation Rate: ${(totalSystemPreserved / results.length * 100).toFixed(1)}%`);
  console.log(`  Total Benchmarks: ${results.length}`);

  console.log('\n✅ Benchmark complete!');
}

// Run benchmarks
runAllBenchmarks().catch(console.error);

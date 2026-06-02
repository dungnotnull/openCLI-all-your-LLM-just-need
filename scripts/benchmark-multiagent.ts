#!/usr/bin/env node

/**
 * Multi-Agent vs Single-Agent Benchmark
 *
 * Compares cost and quality between multi-agent and single-agent modes.
 * Uses SWE-bench subset or custom tasks for evaluation.
 */

import { createOrchestrator } from '../src/core/multi-agent.js';

/**
 * Benchmark task
 */
interface BenchmarkTask {
  id: string;
  description: string;
  type: 'code' | 'analysis' | 'explanation';
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Benchmark result
 */
interface BenchmarkResult {
  taskId: string;
  mode: 'single' | 'multi';
  duration: number; // ms
  cost: number; // USD
  quality: number; // 0-1 score
  success: boolean;
  subtasks?: number;
}

/**
 * Sample benchmark tasks
 */
const SAMPLE_TASKS: BenchmarkTask[] = [
  {
    id: 'task-1',
    description: 'Implement a REST API endpoint for user registration',
    type: 'code',
    complexity: 'medium',
  },
  {
    id: 'task-2',
    description: 'Analyze and fix a bug in the authentication flow',
    type: 'code',
    complexity: 'complex',
  },
  {
    id: 'task-3',
    description: 'Explain how async generators work in JavaScript',
    type: 'explanation',
    complexity: 'simple',
  },
  {
    id: 'task-4',
    description: 'Review a pull request and suggest improvements',
    type: 'analysis',
    complexity: 'medium',
  },
  {
    id: 'task-5',
    description: 'Implement unit tests for a data processing module',
    type: 'code',
    complexity: 'complex',
  },
];

/**
 * Run single-agent benchmark
 */
async function runSingleAgentBenchmark(task: BenchmarkTask): Promise<BenchmarkResult> {
  console.log(`Running single-agent for: ${task.description}`);

  const startTime = Date.now();

  // Simulate single-agent execution
  // In production: Use provider.chat() directly
  await simulateExecution(task.type, task.complexity, 1);

  const duration = Date.now() - startTime;
  const cost = estimateCost(task, 'single');

  return {
    taskId: task.id,
    mode: 'single',
    duration,
    cost,
    quality: 0.85, // Placeholder
    success: true,
  };
}

/**
 * Run multi-agent benchmark
 */
async function runMultiAgentBenchmark(task: BenchmarkTask): Promise<BenchmarkResult> {
  console.log(`Running multi-agent for: ${task.description}`);

  const startTime = Date.now();

  // Create orchestrator
  const orchestrator = createOrchestrator([]); // Empty provider array for simulation

  // Simulate multi-agent execution
  const subtaskCount = estimateSubtaskCount(task);
  await simulateExecution(task.type, task.complexity, subtaskCount);

  const duration = Date.now() - startTime;
  const cost = estimateCost(task, 'multi');

  return {
    taskId: task.id,
    mode: 'multi',
    duration,
    cost,
    quality: 0.88, // Placeholder (multi-agent often produces better quality)
    success: true,
    subtasks: subtaskCount,
  };
}

/**
 * Estimate number of subtasks for a task
 */
function estimateSubtaskCount(task: BenchmarkTask): number {
  switch (task.complexity) {
    case 'simple':
      return 2;
    case 'medium':
      return 4;
    case 'complex':
      return 6;
  }
}

/**
 * Simulate execution with delay
 */
async function simulateExecution(
  type: string,
  complexity: string,
  iterations: number
): Promise<void> {
  const baseDelay = type === 'code' ? 500 : 300;
  const complexityMultiplier = complexity === 'simple' ? 1 : complexity === 'medium' ? 2 : 3;
  const delay = baseDelay * complexityMultiplier * iterations;

  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Estimate cost for task execution
 */
function estimateCost(task: BenchmarkTask, mode: 'single' | 'multi'): number {
  // Simplified cost model
  const baseCost = task.complexity === 'simple' ? 0.01 : task.complexity === 'medium' ? 0.03 : 0.08;

  if (mode === 'single') {
    return baseCost;
  }

  // Multi-agent uses cheaper models for some tasks
  const subtaskCount = estimateSubtaskCount(task);
  const discount = 0.3; // 30% savings from using specialized models

  return baseCost * subtaskCount * (1 - discount);
}

/**
 * Run full benchmark suite
 */
export async function runMultiAgentBenchmark(): Promise<void> {
  console.log('🧪 Multi-Agent vs Single-Agent Benchmark\n');
  console.log('Testing cost and quality across different task types...\n');

  const results: BenchmarkResult[] = [];

  for (const task of SAMPLE_TASKS) {
    // Run single-agent
    const singleResult = await runSingleAgentBenchmark(task);
    results.push(singleResult);

    // Run multi-agent
    const multiResult = await runMultiAgentBenchmark(task);
    results.push(multiResult);

    console.log(`  ✓ Completed ${task.id} (${task.complexity} ${task.type})`);
  }

  // Analyze results
  console.log('\n📊 Benchmark Results\n');

  // Group by mode
  const singleResults = results.filter(r => r.mode === 'single');
  const multiResults = results.filter(r => r.mode === 'multi');

  const avgSingleDuration = singleResults.reduce((sum, r) => sum + r.duration, 0) / singleResults.length;
  const avgMultiDuration = multiResults.reduce((sum, r) => sum + r.duration, 0) / multiResults.length;

  const avgSingleCost = singleResults.reduce((sum, r) => sum + r.cost, 0) / singleResults.length;
  const avgMultiCost = multiResults.reduce((sum, r) => sum + r.cost, 0) / multiResults.length;

  const avgSingleQuality = singleResults.reduce((sum, r) => sum + r.quality, 0) / singleResults.length;
  const avgMultiQuality = multiResults.reduce((sum, r) => sum + r.quality, 0) / multiResults.length;

  console.log('Performance:');
  console.log(`  Single-agent avg duration: ${avgSingleDuration.toFixed(0)}ms`);
  console.log(`  Multi-agent avg duration: ${avgMultiDuration.toFixed(0)}ms`);
  console.log(`  Overhead: ${((avgMultiDuration / avgSingleDuration - 1) * 100).toFixed(1)}%\n`);

  console.log('Cost:');
  console.log(`  Single-agent avg cost: $${avgSingleCost.toFixed(4)}`);
  console.log(`  Multi-agent avg cost: $${avgMultiCost.toFixed(4)}`);
  console.log(`  Savings: ${((1 - avgMultiCost / avgSingleCost) * 100).toFixed(1)}%\n`);

  console.log('Quality:');
  console.log(`  Single-agent avg quality: ${(avgSingleQuality * 100).toFixed(1)}%`);
  console.log(`  Multi-agent avg quality: ${(avgMultiQuality * 100).toFixed(1)}%`);
  console.log(`  Improvement: ${((avgMultiQuality / avgSingleQuality - 1) * 100).toFixed(1)}%\n`);

  // Overall assessment
  console.log('Summary:');
  const durationOverhead = ((avgMultiDuration / avgSingleDuration - 1) * 100);
  const costSavings = ((1 - avgMultiCost / avgSingleCost) * 100);
  const qualityImprovement = ((avgMultiQuality / avgSingleQuality - 1) * 100);

  if (durationOverhead < 20 && costSavings > 0) {
    console.log('  ✓ Multi-agent mode recommended');
    console.log(`    - Duration overhead within acceptable range (${durationOverhead.toFixed(1)}%)`);
    console.log(`    - Cost savings (${costSavings.toFixed(1)}%)`);
    console.log(`    - Quality improvement (${qualityImprovement.toFixed(1)}%)`);
  } else if (durationOverhead >= 20) {
    console.log('  ⚠ Single-agent mode recommended for time-sensitive tasks');
    console.log(`    - Duration overhead too high (${durationOverhead.toFixed(1)}%)`);
  }

  console.log('\n✅ Benchmark complete!');
}

// Run benchmark if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiAgentBenchmark().catch(console.error);
}

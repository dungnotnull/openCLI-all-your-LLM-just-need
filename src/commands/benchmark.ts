/**
 * Benchmark Command
 *
 * Compares different models on the same task.
 * Shows cost, speed, and quality metrics.
 */

import type { ModelProvider } from '../types/index.js';
import { getProvider } from '../providers/registry.js';
import { logger } from '../utils/logger.js';
import { getAuditLogger } from '../utils/audit.js';

/**
 * Benchmark options
 */
export interface BenchmarkOptions {
  task: string;
  providers?: string[];
  metrics?: ('cost' | 'speed' | 'quality')[];
  iterations?: number;
}

/**
 * Benchmark result for a single provider
 */
export interface BenchmarkResult {
  provider: string;
  model: string;
  duration: number; // ms
  inputTokens: number;
  outputTokens: number;
  cost: number; // USD
  quality?: number; // 0-1 score
  success: boolean;
  error?: string;
}

/**
 * Benchmark summary
 */
export interface BenchmarkSummary {
  task: string;
  results: BenchmarkResult[];
  winner: {
    cost: string;
    speed: string;
    quality: string;
  };
  comparison: string;
}

/**
 * Run benchmark comparison
 */
export async function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkSummary> {
  const { task, providers, metrics = ['cost', 'speed', 'quality'], iterations = 1 } = options;

  logger.info({ task, providers, metrics, iterations }, 'Starting benchmark');

  // Determine which providers to test
  const providersToTest = providers || ['deepseek', 'qwen', 'glm'];

  const results: BenchmarkResult[] = [];

  // Test each provider
  for (const providerId of providersToTest) {
    console.log(`\nTesting ${providerId}...`);

    try {
      const provider = await getProvider(providerId);

      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      const result = await benchmarkProvider(provider, task, iterations);
      results.push(result);

      console.log(`  ✓ Cost: $${result.cost.toFixed(4)} | Speed: ${result.duration}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ provider: providerId, error }, 'Provider benchmark failed');

      results.push({
        provider: providerId,
        model: 'unknown',
        duration: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        success: false,
        error: errorMessage,
      });

      console.log(`  ✗ Failed: ${errorMessage}`);
    }
  }

  // Analyze results
  const summary = analyzeResults(task, results, metrics);

  // Log to audit
  const audit = getAuditLogger();
  await audit.log('system_event', 'benchmark', {
    task,
    results,
    summary,
  });

  return summary;
}

/**
 * Benchmark a single provider
 */
async function benchmarkProvider(
  provider: ModelProvider,
  task: string,
  iterations: number
): Promise<BenchmarkResult> {
  const model = provider.models[0]; // Use default model

  if (!model) {
    throw new Error('Provider has no models');
  }

  const startTime = Date.now();

  // TODO: Execute actual task with provider
  // For now, simulate execution
  const estimatedTokens = task.length / 4; // Rough token estimate
  const inputTokens = estimatedTokens + 50; // Add system prompt overhead
  const outputTokens = Math.floor(inputTokens * 0.8); // Typical ratio

  const duration = await simulateProviderCall(provider, task);

  // Calculate cost
  const rates = getProviderRates(provider.id);
  const cost = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;

  return {
    provider: provider.id,
    model: model.id,
    duration,
    inputTokens,
    outputTokens,
    cost,
    quality: 0.85, // Placeholder
    success: true,
  };
}

/**
 * Simulate provider call
 */
async function simulateProviderCall(provider: ModelProvider, task: string): Promise<number> {
  // Simulate different speeds for different providers
  const baseDelay = 1000;

  const delays: Record<string, number> = {
    deepseek: 1200,
    qwen: 800,
    glm: 900,
    minimax: 1500,
    kimi: 1100,
    devstral: 1000,
    ollama: 2000, // Local models can be slower
  };

  const delay = delays[provider.id] || baseDelay;

  await new Promise(resolve => setTimeout(resolve, delay));

  return delay;
}

/**
 * Get provider cost rates (simplified)
 */
function getProviderRates(providerId: string): { input: number; output: number } {
  const rates: Record<string, { input: number; output: number }> = {
    deepseek: { input: 0.14, output: 0.28 },
    qwen: { input: 0.50, output: 1.00 },
    glm: { input: 0.30, output: 0.60 },
    minimax: { input: 0.10, output: 0.20 },
    kimi: { input: 2.00, output: 4.00 },
    devstral: { input: 0.50, output: 1.00 },
    ollama: { input: 0, output: 0 },
  };

  return rates[providerId] || { input: 0.50, output: 1.00 };
}

/**
 * Analyze benchmark results and pick winners
 */
function analyzeResults(
  task: string,
  results: BenchmarkResult[],
  metrics: string[]
): BenchmarkSummary {
  const successful = results.filter(r => r.success);

  if (successful.length === 0) {
    return {
      task,
      results,
      winner: {
        cost: 'N/A (all failed)',
        speed: 'N/A (all failed)',
        quality: 'N/A (all failed)',
      },
      comparison: 'All providers failed the benchmark.',
    };
  }

  // Pick winners
  let costWinner = successful[0]!;
  let speedWinner = successful[0]!;
  let qualityWinner = successful[0]!;

  for (const result of successful) {
    if (result.cost < costWinner.cost) {
      costWinner = result;
    }
    if (result.duration < speedWinner.duration) {
      speedWinner = result;
    }
    if (result.quality && result.quality > (qualityWinner.quality || 0)) {
      qualityWinner = result;
    }
  }

  // Generate comparison text
  const comparisonLines: string[] = [];

  comparisonLines.push(`\n📊 Benchmark Results for: "${task}"\n`);

  if (metrics.includes('cost')) {
    comparisonLines.push(`💰 Cost Winner: ${costWinner.provider} ($${costWinner.cost.toFixed(4)})`);
  }
  if (metrics.includes('speed')) {
    comparisonLines.push(`⚡ Speed Winner: ${speedWinner.provider} (${speedWinner.duration}ms)`);
  }
  if (metrics.includes('quality')) {
    comparisonLines.push(`⭐ Quality Winner: ${qualityWinner.provider} (${((qualityWinner.quality || 0) * 100).toFixed(0)}%)`);
  }

  comparisonLines.push('\nDetailed Results:\n');

  for (const result of successful) {
    const winnerIndicators: string[] = [];
    if (result === costWinner) winnerIndicators.push('💰');
    if (result === speedWinner) winnerIndicators.push('⚡');
    if (result === qualityWinner) winnerIndicators.push('⭐');

    const indicators = winnerIndicators.length ? ' ' + winnerIndicators.join(' ') : '';

    comparisonLines.push(
      `${result.provider}${indicators}:\n` +
      `   Duration: ${result.duration}ms\n` +
      `   Cost: $${result.cost.toFixed(4)}\n` +
      `   Tokens: ${result.inputTokens + result.outputTokens}\n`
    );
  }

  return {
    task,
    results,
    winner: {
      cost: costWinner.provider,
      speed: speedWinner.provider,
      quality: qualityWinner.provider,
    },
    comparison: comparisonLines.join('\n'),
  };
}

/**
 * Setup benchmark command for CLI
 */
export function setupBenchmarkCommand(program: any): void {
  program
    .command('benchmark')
    .description('Compare models on a specific task')
    .argument('<task>', 'Task to benchmark models on')
    .option('-p, --providers <list>', 'Comma-separated list of providers to test')
    .option('-m, --metrics <list>', 'Metrics to evaluate (cost,speed,quality)', 'cost,speed,quality')
    .option('-i, --iterations <num>', 'Number of iterations per provider', '1')
    .action(async (task: string, options: any) => {
      const providers = options.providers ? options.providers.split(',') : undefined;
      const metrics = options.metrics ? options.metrics.split(',') : undefined;
      const iterations = parseInt(options.iterations) || 1;

      const summary = await runBenchmark({
        task,
        providers,
        metrics,
        iterations,
      });

      console.log(summary.comparison);
    });
}

/**
 * Cost Dashboard Command
 *
 * Displays cost statistics and per-provider breakdown.
 * Usage: opencli --cost or opencli cost export
 */

import type { EnhancedTrackerOptions } from '../cost/enhanced-tracker.js';
import { EnhancedCostTracker } from '../cost/enhanced-tracker.js';
import { getBudgetGuard } from '../cost/budget-guard.js';
import { getProvider } from '../providers/registry.js';
import { logger } from '../utils/logger.js';

/**
 * Cost dashboard options
 */
export interface CostDashboardOptions {
  provider?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all';
  format?: 'table' | 'json' | 'csv';
  exportPath?: string;
}

/**
 * Display cost dashboard
 */
export async function showCostDashboard(options: CostDashboardOptions = {}): Promise<void> {
  const tracker = new EnhancedCostTracker();

  try {
    await tracker.loadFromStorage();
  } catch (error) {
    logger.warn({ error }, 'Failed to load cost history from storage');
  }

  const periodTotals = tracker.getPeriodTotals();
  const providerSummary = tracker.getProviderSummary();
  const budgetGuard = getBudgetGuard();
  const budgetStatus = budgetGuard.getBudgetStatus();

  console.log('\n💰 Cost Dashboard\n');
  console.log('=' .repeat(60));

  // Budget Status
  if (budgetStatus.enabled) {
    const percentUsed = budgetStatus.percentUsed.toFixed(1);
    const barLength = 30;
    const filled = Math.min(Math.round((budgetStatus.currentSpend / budgetStatus.limit) * barLength), barLength);
    const empty = barLength - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    console.log(`\n📊 Budget Status:`);
    console.log(`   [$${budgetStatus.currentSpend.toFixed(2)} / $${budgetStatus.limit.toFixed(2)}] ${percentUsed}%`);
    console.log(`   ${bar}`);
    console.log(`   Remaining: $${budgetStatus.remaining.toFixed(2)}`);

    if (budgetStatus.percentUsed >= 80) {
      console.log(`   ⚠️  Warning: Approaching budget limit`);
    }
    console.log('');
  }

  // Period Totals
  console.log(`\n📈 Period Totals:`);
  console.log(`   Daily (24h):   $${periodTotals.daily.toFixed(6)}`);
  console.log(`   Weekly (7d):   $${periodTotals.weekly.toFixed(6)}`);
  console.log(`   Monthly (30d): $${periodTotals.monthly.toFixed(6)}`);

  // Session Stats
  console.log(`\n📊 Session Stats:`);
  console.log(`   Current Session: $${tracker.getSessionTotal().toFixed(6)}`);
  console.log(`   Total Calls: ${tracker.getCallCount()}`);

  // Per-Provider Breakdown
  if (providerSummary.length > 0) {
    console.log(`\n🔷 Per-Provider Breakdown:`);
    console.log(`   ${'Provider'.padEnd(15)} ${'Calls'.padStart(8)} ${'Total Cost'.padStart(12)} ${'Avg/Call'.padStart(10)}`);
    console.log(`   ${'-'.repeat(15)} ${'-'.repeat(8)} ${'-'.repeat(12)} ${'-'.repeat(10)}`);

    for (const summary of providerSummary) {
      const providerName = summary.provider.charAt(0).toUpperCase() + summary.provider.slice(1);
      console.log(
        `   ${providerName.padEnd(15)} ` +
        `${summary.callCount.toString().padStart(8)} ` +
        `$${summary.totalCost.toFixed(6).padStart(11)} ` +
        `$${summary.averageCostPerCall.toFixed(6).padStart(9)}`
      );
    }
  }

  // Cost Rates Reference
  console.log(`\n💡 Cost Rates (per 1M tokens):`);
  const providerId = options.provider || 'deepseek';
  const provider = await getProvider(providerId);
  if (provider) {
    const rates = tracker.getRates?.(providerId);
    if (rates) {
      console.log(`   ${provider.name}:`);
      console.log(`   - Input:  $${rates.inputCostPerMillion.toFixed(4)}`);
      console.log(`   - Output: $${rates.outputCostPerMillion.toFixed(4)}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('');
}

/**
 * Export costs to file
 */
export async function exportCosts(
  options: CostDashboardOptions = {}
): Promise<string> {
  const tracker = new EnhancedCostTracker();

  try {
    await tracker.loadFromStorage();
  } catch (error) {
    logger.warn({ error }, 'Failed to load cost history from storage');
  }

  const format = options.format || 'csv';
  const exportPath = options.exportPath;

  if (format === 'csv') {
    const path = await tracker.exportToCSV(exportPath);
    console.log(`\n✅ Costs exported to: ${path}`);
    return path;
  }

  if (format === 'json') {
    const path = exportPath || `${process.env.HOME}/.opencli/costs-export.json`;
    const data = {
      periodTotals: tracker.getPeriodTotals(),
      providerSummary: tracker.getProviderSummary(),
      records: tracker['records'],
    };

    const { writeFile } = await import('fs/promises');
    await writeFile(path, JSON.stringify(data, null, 2));
    console.log(`\n✅ Costs exported to: ${path}`);
    return path;
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Setup cost command for CLI
 */
export function setupCostCommand(program: any): void {
  const costCmd = program
    .command('cost')
    .description('Cost tracking and dashboard');

  costCmd
    .command('dashboard')
    .description('Show cost dashboard')
    .option('-p, --provider <name>', 'Filter by provider')
    .option('--period <period>', 'Time period (daily, weekly, monthly, all)')
    .action(async (options: CostDashboardOptions) => {
      await showCostDashboard(options);
    });

  costCmd
    .command('export')
    .description('Export cost data')
    .option('-f, --format <format>', 'Export format (csv, json)', 'csv')
    .option('-o, --output <path>', 'Output file path')
    .action(async (options: CostDashboardOptions) => {
      await exportCosts(options);
    });
}

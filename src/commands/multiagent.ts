/**
 * Multi-Agent Toggle Slash Command
 *
 * Enables/disables multi-agent mode during conversation.
 * Usage: /multiagent [on|off|status]
 */

import type { SlashContext } from './slash.js';
import { logger } from '../utils/logger.js';

/**
 * Multi-agent mode state
 */
interface MultiAgentState {
  enabled: boolean;
  orchestratorReady: boolean;
  tasksCompleted: number;
  totalSavings: number; // Cost savings from using specialized models
}

// Singleton state
const state: MultiAgentState = {
  enabled: false,
  orchestratorReady: false,
  tasksCompleted: 0,
  totalSavings: 0,
};

/**
 * Handle /multiagent slash command
 */
export async function handleMultiAgentCommand(
  args: string[],
  context: SlashContext
): Promise<string> {
  const action = args[0]?.toLowerCase();

  switch (action) {
    case 'on':
    case 'enable':
    case 'true':
      state.enabled = true;
      logger.info('Multi-agent mode enabled');
      return '✓ Multi-agent mode enabled. Tasks will be decomposed and routed to specialized models.';

    case 'off':
    case 'disable':
    case 'false':
      state.enabled = false;
      logger.info('Multi-agent mode disabled');
      return '✓ Multi-agent mode disabled. Single-agent mode active.';

    case 'status':
      return formatMultiAgentStatus();

    default:
      // No action specified, show status
      return formatMultiAgentStatus();
  }
}

/**
 * Format multi-agent status for display
 */
function formatMultiAgentStatus(): string {
  const lines: string[] = [];

  lines.push('🤖 Multi-Agent Status\n');
  lines.push(`Mode: ${state.enabled ? 'Enabled' : 'Disabled'}`);
  lines.push(`Orchestrator: ${state.orchestratorReady ? 'Ready' : 'Not initialized'}`);

  if (state.enabled) {
    lines.push(`\nTasks completed: ${state.tasksCompleted}`);
    lines.push(`Estimated cost savings: $${state.totalSavings.toFixed(4)}`);
    lines.push(`\nModel routing:`);
    lines.push(`  - Code tasks: → Specialized code model (DeepSeek V3)`);
    lines.push(`  - Text tasks: → Fast text model (Qwen Turbo)`);
    lines.push(`  - Analysis: → Lightweight model (GLM-4 Flash)`);
  }

  return lines.join('\n');
}

/**
 * Check if multi-agent mode is enabled
 */
export function isMultiAgentEnabled(): boolean {
  return state.enabled;
}

/**
 * Update multi-agent statistics
 */
export function updateMultiAgentStats(tasksCompleted: number, costSavings: number): void {
  state.tasksCompleted += tasksCompleted;
  state.totalSavings += costSavings;
}

/**
 * Get current state
 */
export function getMultiAgentState(): MultiAgentState {
  return { ...state };
}

/**
 * Multi-Agent Toggle Slash Command
 *
 * Enables/disables multi-agent mode during conversation.
 * Usage: /multiagent [on|off|status]
 */
import type { SlashContext } from './slash.js';
/**
 * Multi-agent mode state
 */
interface MultiAgentState {
    enabled: boolean;
    orchestratorReady: boolean;
    tasksCompleted: number;
    totalSavings: number;
}
/**
 * Handle /multiagent slash command
 */
export declare function handleMultiAgentCommand(args: string[], context: SlashContext): Promise<string>;
/**
 * Check if multi-agent mode is enabled
 */
export declare function isMultiAgentEnabled(): boolean;
/**
 * Update multi-agent statistics
 */
export declare function updateMultiAgentStats(tasksCompleted: number, costSavings: number): void;
/**
 * Get current state
 */
export declare function getMultiAgentState(): MultiAgentState;
export {};
//# sourceMappingURL=multiagent.d.ts.map
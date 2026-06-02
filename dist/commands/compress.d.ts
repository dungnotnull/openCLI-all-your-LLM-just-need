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
import type { Session } from '../types/index.js';
export interface CompressCommandOptions {
    force?: boolean;
    reset?: boolean;
    strategy?: 'sliding' | 'semantic' | 'adaptive';
}
/**
 * Handle /compress slash command
 *
 * @param session - Current session
 * @param options - Command options
 * @returns Human-readable response message
 */
export declare function handleCompressCommand(session: Session, options?: CompressCommandOptions): Promise<string>;
//# sourceMappingURL=compress.d.ts.map
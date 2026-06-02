import type { Session } from '../types/index.js';
export interface SlashContext {
    currentProvider: string;
    currentModel: string;
    session: Session;
    switchProvider: (providerId: string) => Promise<void>;
    switchModel: (modelId: string) => Promise<void>;
}
export declare function handleSlashCommand(command: string, context: SlashContext): Promise<string>;
//# sourceMappingURL=slash.d.ts.map
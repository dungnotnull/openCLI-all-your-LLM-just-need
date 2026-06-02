/**
 * Audit Log System
 *
 * Logs all tool calls, provider interactions, and operations
 * with timestamps for security and debugging purposes.
 *
 * Log location: ~/.opencli/audit.log
 */
/**
 * Audit log entry types
 */
export type AuditEntryType = 'tool_call' | 'provider_call' | 'config_change' | 'budget_alert' | 'system_event' | 'error';
/**
 * Audit log entry
 */
export interface AuditEntry {
    timestamp: string;
    type: AuditEntryType;
    sessionId?: string;
    source: string;
    details: Record<string, unknown>;
    level?: 'info' | 'warn' | 'error';
}
/**
 * Audit log options
 */
export interface AuditOptions {
    sessionId?: string;
    level?: 'info' | 'warn' | 'error';
}
/**
 * Audit Logger Class
 */
export declare class AuditLogger {
    private logPath;
    private writeQueue;
    private flushInterval;
    private readonly maxQueueSize;
    constructor();
    /**
     * Log an audit entry
     */
    log(type: AuditEntryType, source: string, details?: Record<string, unknown>, options?: AuditOptions): Promise<void>;
    /**
     * Log to console (for debugging)
     */
    private logToConsole;
    /**
     * Flush queued entries to disk
     */
    flush(): Promise<void>;
    /**
     * Format audit entry for file output
     */
    private formatEntry;
    /**
     * Start periodic flush interval
     */
    private startFlushInterval;
    /**
     * Stop and flush
     */
    shutdown(): Promise<void>;
    /**
     * Read recent audit entries
     */
    readRecent(count?: number): Promise<AuditEntry[]>;
    /**
     * Parse audit log line
     */
    private parseLine;
    /**
     * Get audit statistics
     */
    getStats(): Promise<{
        totalEntries: number;
        byType: Record<AuditEntryType, number>;
        recentActivity: {
            last24h: number;
            last1h: number;
        };
    }>;
}
/**
 * Get or create audit logger instance
 */
export declare function getAuditLogger(): AuditLogger;
/**
 * Convenience function to log tool calls
 */
export declare function logToolCall(toolName: string, input: Record<string, unknown>, result: {
    success: boolean;
    duration?: number;
}): Promise<void>;
/**
 * Convenience function to log provider calls
 */
export declare function logProviderCall(provider: string, model: string, inputTokens: number, outputTokens: number, cost: number): Promise<void>;
//# sourceMappingURL=audit.d.ts.map
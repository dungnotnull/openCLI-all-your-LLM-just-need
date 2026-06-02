/**
 * Audit Log System
 *
 * Logs all tool calls, provider interactions, and operations
 * with timestamps for security and debugging purposes.
 *
 * Log location: ~/.opencli/audit.log
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { logger } from './logger.js';

/**
 * Audit log entry types
 */
export type AuditEntryType =
  | 'tool_call'
  | 'provider_call'
  | 'config_change'
  | 'budget_alert'
  | 'system_event'
  | 'error';

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: string;
  type: AuditEntryType;
  sessionId?: string;
  source: string; // What triggered this entry
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
export class AuditLogger {
  private logPath: string;
  private writeQueue: AuditEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 100;

  constructor() {
    this.logPath = join(homedir(), '.opencli', 'audit.log');
    this.startFlushInterval();
  }

  /**
   * Log an audit entry
   */
  async log(
    type: AuditEntryType,
    source: string,
    details: Record<string, unknown> = {},
    options: AuditOptions = {}
  ): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      type,
      sessionId: options.sessionId,
      source,
      details,
      level: options.level,
    };

    // Add to queue
    this.writeQueue.push(entry);

    // Flush if queue is full
    if (this.writeQueue.length >= this.maxQueueSize) {
      await this.flush();
    }

    // Also log to console for immediate visibility
    this.logToConsole(entry);
  }

  /**
   * Log to console (for debugging)
   */
  private logToConsole(entry: AuditEntry): void {
    const level = entry.level || 'info';
    const message = `[${entry.timestamp}] [${entry.type}] ${entry.source}`;

    switch (level) {
      case 'error':
        logger.error({ entry }, message);
        break;
      case 'warn':
        logger.warn({ entry }, message);
        break;
      default:
        logger.debug({ entry }, message);
    }
  }

  /**
   * Flush queued entries to disk
   */
  async flush(): Promise<void> {
    if (this.writeQueue.length === 0) {
      return;
    }

    const entries = this.writeQueue.splice(0);

    try {
      await fs.mkdir(join(this.logPath, '..'), { recursive: true });

      const logLines = entries.map(entry => this.formatEntry(entry));
      const logContent = logLines.join('\n') + '\n';

      await fs.appendFile(this.logPath, logContent);
    } catch (error) {
      logger.error({ error }, 'Failed to write audit log');
    }
  }

  /**
   * Format audit entry for file output
   */
  private formatEntry(entry: AuditEntry): string {
    const parts: string[] = [];

    parts.push(entry.timestamp);
    parts.push(`[${entry.type}]`);
    parts.push(entry.source);

    if (entry.sessionId) {
      parts.push(`(session: ${entry.sessionId})`);
    }

    if (entry.level && entry.level !== 'info') {
      parts.push(`[${entry.level.toUpperCase()}]`);
    }

    const baseLine = parts.join(' ');

    // Add details as JSON
    if (Object.keys(entry.details).length > 0) {
      return `${baseLine} ${JSON.stringify(entry.details)}`;
    }

    return baseLine;
  }

  /**
   * Start periodic flush interval
   */
  private startFlushInterval(): void {
    // Flush every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        logger.error({ error }, 'Audit log flush failed');
      });
    }, 5000);
  }

  /**
   * Stop and flush
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
  }

  /**
   * Read recent audit entries
   */
  async readRecent(count: number = 50): Promise<AuditEntry[]> {
    try {
      const content = await fs.readFile(this.logPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      // Parse recent lines
      const recent = lines.slice(-count);
      const entries: AuditEntry[] = [];

      for (const line of recent) {
        try {
          const entry = this.parseLine(line);
          if (entry) {
            entries.push(entry);
          }
        } catch (error) {
          // Skip malformed lines
        }
      }

      return entries;
    } catch (error) {
      // File doesn't exist yet
      return [];
    }
  }

  /**
   * Parse audit log line
   */
  private parseLine(line: string): AuditEntry | null {
    // Format: [timestamp] [type] source (details)
    const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] (\S+)(?:\s+\(session:\s*([^\)]+)\))?(?:\s+(.+))?$/);

    if (!match) {
      return null;
    }

    const [, timestamp, type, source, sessionId, detailsStr] = match;

    const entry: AuditEntry = {
      timestamp: timestamp ?? '',
      type: (type ?? 'system_event') as AuditEntryType,
      source: source ?? '',
      sessionId,
      details: detailsStr ? JSON.parse(detailsStr) : {},
    };

    return entry;
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    byType: Record<AuditEntryType, number>;
    recentActivity: {
      last24h: number;
      last1h: number;
    };
  }> {
    const entries = await this.readRecent(1000);

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;

    const byType: Record<string, number> = {};
    let last24h = 0;
    let last1h = 0;

    for (const entry of entries) {
      const entryTime = new Date(entry.timestamp).getTime();

      byType[entry.type] = (byType[entry.type] || 0) + 1;

      if (entryTime >= dayAgo) {
        last24h++;
      }
      if (entryTime >= hourAgo) {
        last1h++;
      }
    }

    return {
      totalEntries: entries.length,
      byType: byType as Record<AuditEntryType, number>,
      recentActivity: { last24h, last1h },
    };
  }
}

/**
 * Singleton instance
 */
let auditLoggerInstance: AuditLogger | null = null;

/**
 * Get or create audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

/**
 * Convenience function to log tool calls
 */
export async function logToolCall(
  toolName: string,
  input: Record<string, unknown>,
  result: { success: boolean; duration?: number }
): Promise<void> {
  const audit = getAuditLogger();

  await audit.log('tool_call', toolName, {
    input,
    success: result.success,
    duration: result.duration,
  });
}

/**
 * Convenience function to log provider calls
 */
export async function logProviderCall(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
): Promise<void> {
  const audit = getAuditLogger();

  await audit.log('provider_call', provider, {
    model,
    inputTokens,
    outputTokens,
    cost,
  });
}

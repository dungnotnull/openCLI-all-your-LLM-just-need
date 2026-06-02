/**
 * Knowledge Updater / Scheduler
 *
 * Handles periodic knowledge updates via cron jobs.
 * Can be triggered manually or scheduled.
 */
import type { CronSchedule } from './types.js';
/**
 * Update task configuration
 */
export interface UpdateTask {
    id: string;
    schedule: CronSchedule;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}
/**
 * Knowledge updater status
 */
export interface UpdaterStatus {
    running: boolean;
    lastRun?: Date;
    nextRun?: Date;
    totalCrawls: number;
    totalEntriesAdded: number;
}
/**
 * Knowledge updater manager
 */
export declare class KnowledgeUpdater {
    private brain;
    private tasks;
    private intervalId;
    private status;
    /**
     * Add scheduled update task
     */
    addTask(task: UpdateTask): void;
    /**
     * Remove update task
     */
    removeTask(taskId: string): void;
    /**
     * Start the updater
     */
    start(): Promise<void>;
    /**
     * Stop the updater
     */
    stop(): void;
    /**
     * Run crawl immediately (manual trigger)
     */
    runNow(): Promise<number>;
    /**
     * Check if any tasks are due to run and execute them
     */
    private checkAndRun;
    /**
     * Update next run time for a specific task
     */
    private updateTaskNextRun;
    /**
     * Update next run times for all tasks
     */
    private updateNextRunTimes;
    /**
     * Calculate next run time from schedule
     */
    private calculateNextRun;
    /**
     * Get current status
     */
    getStatus(): UpdaterStatus;
    /**
     * Get all tasks
     */
    getTasks(): UpdateTask[];
}
/**
 * Get or create updater instance
 */
export declare function getKnowledgeUpdater(): KnowledgeUpdater;
/**
 * Setup default scheduled tasks
 */
export declare function setupDefaultTasks(): void;
//# sourceMappingURL=updater.d.ts.map
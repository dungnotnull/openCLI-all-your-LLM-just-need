/**
 * Knowledge Updater / Scheduler
 *
 * Handles periodic knowledge updates via cron jobs.
 * Can be triggered manually or scheduled.
 */
import { getKnowledgeBrain } from './knowledge-brain.js';
import { logger } from '../utils/logger.js';
/**
 * Knowledge updater manager
 */
export class KnowledgeUpdater {
    brain = getKnowledgeBrain();
    tasks = new Map();
    intervalId = null;
    status = {
        running: false,
        totalCrawls: 0,
        totalEntriesAdded: 0,
    };
    /**
     * Add scheduled update task
     */
    addTask(task) {
        this.tasks.set(task.id, task);
        logger.info({ taskId: task.id }, 'Update task added');
    }
    /**
     * Remove update task
     */
    removeTask(taskId) {
        this.tasks.delete(taskId);
        logger.info({ taskId }, 'Update task removed');
    }
    /**
     * Start the updater
     */
    async start() {
        if (this.status.running) {
            logger.warn('Updater already running');
            return;
        }
        logger.info('Starting Knowledge Updater...');
        // Calculate next run times
        this.updateNextRunTimes();
        // Check every minute
        this.intervalId = setInterval(() => {
            this.checkAndRun();
        }, 60 * 1000);
        this.status.running = true;
        logger.info('Knowledge Updater started');
    }
    /**
     * Stop the updater
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.status.running = false;
        logger.info('Knowledge Updater stopped');
    }
    /**
     * Run crawl immediately (manual trigger)
     */
    async runNow() {
        logger.info('Running manual knowledge crawl...');
        const startTime = Date.now();
        const entriesAdded = await this.brain.crawl();
        const duration = Date.now() - startTime;
        this.status.totalCrawls++;
        this.status.totalEntriesAdded += entriesAdded;
        this.status.lastRun = new Date();
        logger.info({
            entriesAdded,
            duration: `${duration}ms`,
            totalCrawls: this.status.totalCrawls,
        }, 'Manual crawl complete');
        return entriesAdded;
    }
    /**
     * Check if any tasks are due to run and execute them
     */
    async checkAndRun() {
        const now = new Date();
        for (const [id, task] of this.tasks) {
            if (!task.enabled) {
                continue;
            }
            if (task.nextRun && now >= task.nextRun) {
                logger.info({ taskId: id }, 'Running scheduled task');
                try {
                    await this.runNow();
                    task.lastRun = now;
                    this.updateTaskNextRun(id);
                }
                catch (error) {
                    logger.error({ taskId: id, error }, 'Task execution failed');
                }
            }
        }
    }
    /**
     * Update next run time for a specific task
     */
    updateTaskNextRun(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        task.nextRun = this.calculateNextRun(task.schedule);
    }
    /**
     * Update next run times for all tasks
     */
    updateNextRunTimes() {
        for (const [id, task] of this.tasks) {
            task.nextRun = this.calculateNextRun(task.schedule);
        }
    }
    /**
     * Calculate next run time from schedule
     */
    calculateNextRun(schedule) {
        const now = new Date();
        const next = new Date(now);
        switch (schedule.frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                if (schedule.hour !== undefined) {
                    next.setHours(schedule.hour, 0, 0, 0);
                }
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                if (schedule.dayOfWeek !== undefined) {
                    next.setDate(next.getDate() + (schedule.dayOfWeek - next.getDay() + 7) % 7);
                }
                if (schedule.hour !== undefined) {
                    next.setHours(schedule.hour, 0, 0, 0);
                }
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                if (schedule.hour !== undefined) {
                    next.setHours(schedule.hour, 0, 0, 0);
                }
                break;
        }
        return next;
    }
    /**
     * Get current status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get all tasks
     */
    getTasks() {
        return Array.from(this.tasks.values());
    }
}
/**
 * Singleton instance
 */
let updaterInstance = null;
/**
 * Get or create updater instance
 */
export function getKnowledgeUpdater() {
    if (!updaterInstance) {
        updaterInstance = new KnowledgeUpdater();
    }
    return updaterInstance;
}
/**
 * Setup default scheduled tasks
 */
export function setupDefaultTasks() {
    const updater = getKnowledgeUpdater();
    // Daily crawl at 2 AM
    updater.addTask({
        id: 'daily-crawl',
        schedule: { frequency: 'daily', hour: 2 },
        enabled: false, // Disabled by default, user must enable
    });
    // Weekly crawl on Sunday at 3 AM
    updater.addTask({
        id: 'weekly-crawl',
        schedule: { frequency: 'weekly', dayOfWeek: 0, hour: 3 },
        enabled: false,
    });
}
//# sourceMappingURL=updater.js.map
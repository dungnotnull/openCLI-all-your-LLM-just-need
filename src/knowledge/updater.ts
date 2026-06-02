/**
 * Knowledge Updater / Scheduler
 *
 * Handles periodic knowledge updates via cron jobs.
 * Can be triggered manually or scheduled.
 */

import type { CronSchedule } from './types.js';
import { getKnowledgeBrain } from './knowledge-brain.js';
import { logger } from '../utils/logger.js';

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
export class KnowledgeUpdater {
  private brain = getKnowledgeBrain();
  private tasks: Map<string, UpdateTask> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private status: UpdaterStatus = {
    running: false,
    totalCrawls: 0,
    totalEntriesAdded: 0,
  };

  /**
   * Add scheduled update task
   */
  addTask(task: UpdateTask): void {
    this.tasks.set(task.id, task);
    logger.info({ taskId: task.id }, 'Update task added');
  }

  /**
   * Remove update task
   */
  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
    logger.info({ taskId }, 'Update task removed');
  }

  /**
   * Start the updater
   */
  async start(): Promise<void> {
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
  stop(): void {
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
  async runNow(): Promise<number> {
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
  private async checkAndRun(): Promise<void> {
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
        } catch (error) {
          logger.error({ taskId: id, error }, 'Task execution failed');
        }
      }
    }
  }

  /**
   * Update next run time for a specific task
   */
  private updateTaskNextRun(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    task.nextRun = this.calculateNextRun(task.schedule);
  }

  /**
   * Update next run times for all tasks
   */
  private updateNextRunTimes(): void {
    for (const [id, task] of this.tasks) {
      task.nextRun = this.calculateNextRun(task.schedule);
    }
  }

  /**
   * Calculate next run time from schedule
   */
  private calculateNextRun(schedule: CronSchedule): Date {
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
  getStatus(): UpdaterStatus {
    return { ...this.status };
  }

  /**
   * Get all tasks
   */
  getTasks(): UpdateTask[] {
    return Array.from(this.tasks.values());
  }
}

/**
 * Singleton instance
 */
let updaterInstance: KnowledgeUpdater | null = null;

/**
 * Get or create updater instance
 */
export function getKnowledgeUpdater(): KnowledgeUpdater {
  if (!updaterInstance) {
    updaterInstance = new KnowledgeUpdater();
  }
  return updaterInstance;
}

/**
 * Setup default scheduled tasks
 */
export function setupDefaultTasks(): void {
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

/**
 * Multi-Agent Task Router System
 *
 * Decomposes complex tasks into subtasks, routes to specialized models,
 * and coordinates execution across multiple agents.
 */

import type { Message, ModelProvider, ToolSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Subtask types for classification
 */
export type SubtaskType = 'code' | 'text' | 'search' | 'test' | 'analysis' | 'unknown';

/**
 * Subtask definition
 */
export interface Subtask {
  id: string;
  type: SubtaskType;
  description: string;
  parentTask?: string; // ID of parent task
  dependencies: string[]; // IDs of subtasks this depends on
  assignedModel?: string; // Model assigned to this subtask
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any; // Result from execution
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Task decomposition plan
 */
export interface TaskPlan {
  taskId: string;
  description: string;
  subtasks: Subtask[];
  createdAt: Date;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

/**
 * Model preference per task type
 */
export interface ModelPreferences {
  code: string; // Model for code tasks
  text: string; // Model for text generation
  search: string; // Model for web search
  test: string; // Model for testing
  analysis: string; // Model for analysis
  orchestrator: string; // Model for coordination
}

/**
 * Default model preferences (cost-optimized)
 */
export const DEFAULT_MODEL_PREFERENCES: ModelPreferences = {
  code: 'deepseek-v3', // Strong code capabilities
  text: 'qwen-turbo', // Fast text generation
  search: 'qwen-turbo', // Fast for search
  test: 'deepseek-v3', // Thorough testing
  analysis: 'glm-4-flash', // Quick analysis
  orchestrator: 'glm-4-flash', // Lightweight coordination
};

/**
 * Task Decomposer
 *
 * Uses LLM to break down complex tasks into executable subtasks.
 */
export class TaskDecomposer {
  /**
   * Decompose a task into subtasks
   */
  async decompose(task: string, context?: string): Promise<TaskPlan> {
    logger.info({ task }, 'Decomposing task');

    // TODO: Implement LLM-based decomposition
    // For now, use simple heuristic-based decomposition

    const subtasks = this.heuristicDecompose(task);

    return {
      taskId: this.generateId(),
      description: task,
      subtasks,
      createdAt: new Date(),
      status: 'planning',
    };
  }

  /**
   * Simple heuristic-based task decomposition
   * (Fallback when LLM is not available)
   */
  private heuristicDecompose(task: string): Subtask[] {
    const subtasks: Subtask[] = [];
    const taskLower = task.toLowerCase();

    // Detect common patterns
    if (taskLower.includes('implement') || taskLower.includes('create') || taskLower.includes('build')) {
      subtasks.push({
        id: this.generateId(),
        type: 'code',
        description: 'Implement the requested feature/function',
        dependencies: [],
        status: 'pending',
      });

      subtasks.push({
        id: this.generateId(),
        type: 'test',
        description: 'Test the implementation',
        dependencies: [subtasks[0]!.id],
        status: 'pending',
      });
    }

    if (taskLower.includes('fix') || taskLower.includes('debug')) {
      subtasks.push({
        id: this.generateId(),
        type: 'analysis',
        description: 'Analyze the issue and identify root cause',
        dependencies: [],
        status: 'pending',
      });

      subtasks.push({
        id: this.generateId(),
        type: 'code',
        description: 'Implement the fix',
        dependencies: [subtasks[subtasks.length - 1]!.id],
        status: 'pending',
      });

      subtasks.push({
        id: this.generateId(),
        type: 'test',
        description: 'Verify the fix',
        dependencies: [subtasks[subtasks.length - 1]!.id],
        status: 'pending',
      });
    }

    if (taskLower.includes('explain') || taskLower.includes('document')) {
      subtasks.push({
        id: this.generateId(),
        type: 'text',
        description: 'Generate explanation or documentation',
        dependencies: [],
        status: 'pending',
      });
    }

    if (taskLower.includes('search') || taskLower.includes('find') || taskLower.includes('lookup')) {
      subtasks.push({
        id: this.generateId(),
        type: 'search',
        description: 'Search for relevant information',
        dependencies: [],
        status: 'pending',
      });
    }

    // If no pattern matched, create a generic task
    if (subtasks.length === 0) {
      subtasks.push({
        id: this.generateId(),
        type: 'unknown',
        description: task,
        dependencies: [],
        status: 'pending',
      });
    }

    return subtasks;
  }

  private generateId(): string {
    return `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Subtask Classifier
 *
 * Classifies subtasks by type using rule-based + LLM hybrid approach.
 */
export class SubtaskClassifier {
  /**
   * Classify a subtask by type
   */
  classify(subtask: Subtask): SubtaskType {
    // If already classified, return
    if (subtask.type !== 'unknown') {
      return subtask.type;
    }

    const desc = subtask.description.toLowerCase();
    const keywords: Record<SubtaskType, string[]> = {
      code: ['implement', 'code', 'function', 'class', 'fix', 'refactor', 'write', 'create'],
      text: ['explain', 'document', 'describe', 'summarize', 'write'],
      search: ['search', 'find', 'lookup', 'query'],
      test: ['test', 'verify', 'check', 'assert'],
      analysis: ['analyze', 'review', 'examine', 'investigate', 'understand'],
      unknown: [],
    };

    for (const [type, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (desc.includes(word)) {
          return type as SubtaskType;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Classify multiple subtasks
   */
  classifyAll(subtasks: Subtask[]): Subtask[] {
    return subtasks.map(st => ({
      ...st,
      type: this.classify(st),
    }));
  }
}

/**
 * Model Selector
 *
 * Selects the best model for each subtask type.
 */
export class ModelSelector {
  private preferences: ModelPreferences;

  constructor(preferences?: Partial<ModelPreferences>) {
    this.preferences = { ...DEFAULT_MODEL_PREFERENCES, ...preferences };
  }

  /**
   * Select model for a subtask
   */
  selectModel(subtask: Subtask): string {
    // Handle unknown task types by falling back to code model
    if (subtask.type === 'unknown' || !this.preferences[subtask.type as keyof ModelPreferences]) {
      return this.preferences.code;
    }
    return this.preferences[subtask.type as keyof ModelPreferences];
  }

  /**
   * Assign models to all subtasks
   */
  assignModels(subtasks: Subtask[]): Subtask[] {
    return subtasks.map(st => ({
      ...st,
      assignedModel: this.selectModel(st),
    }));
  }

  /**
   * Update model preferences
   */
  setPreferences(preferences: Partial<ModelPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Get current preferences
   */
  getPreferences(): ModelPreferences {
    return { ...this.preferences };
  }
}

/**
 * Result Merger
 *
 * Combines outputs from multiple sub-agents into coherent response.
 */
export class ResultMerger {
  /**
   * Merge results from completed subtasks
   */
  mergeResults(plan: TaskPlan): string {
    const completed = plan.subtasks.filter(st => st.status === 'completed');
    const failed = plan.subtasks.filter(st => st.status === 'failed');

    if (completed.length === 0) {
      if (failed.length > 0) {
        return `Task failed. ${failed.length} subtask(s) failed:\n${
          failed.map(f => `- ${f.description}: ${f.error || 'Unknown error'}`).join('\n')
        }`;
      }
      return 'No subtasks completed.';
    }

    const lines: string[] = [];

    lines.push(`Task: ${plan.description}\n`);
    lines.push(`Completed ${completed.length} of ${plan.subtasks.length} subtasks:\n`);

    for (const subtask of completed) {
      lines.push(`✓ ${subtask.description}`);
      if (subtask.result && typeof subtask.result === 'string') {
        const preview = subtask.result.length > 100
          ? subtask.result.slice(0, 100) + '...'
          : subtask.result;
        lines.push(`  Result: ${preview}`);
      }
      lines.push('');
    }

    if (failed.length > 0) {
      lines.push(`\nFailed subtasks:\n`);
      for (const subtask of failed) {
        lines.push(`✗ ${subtask.description}: ${subtask.error || 'Unknown error'}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Merge code results specifically
   */
  mergeCodeResults(plan: TaskPlan): string {
    const codeTasks = plan.subtasks.filter(st => st.type === 'code' && st.status === 'completed');

    if (codeTasks.length === 0) {
      return 'No code subtasks completed.';
    }

    const lines: string[] = [];

    lines.push(`Code Implementation Results:\n`);

    for (const task of codeTasks) {
      if (task.result) {
        lines.push(`// ${task.description}`);
        lines.push(task.result as string);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

/**
 * Orchestrator Agent
 *
 * Coordinates multi-agent execution, manages dependencies, and tracks progress.
 */
export class OrchestratorAgent {
  private decomposer: TaskDecomposer;
  private classifier: SubtaskClassifier;
  private modelSelector: ModelSelector;
  private resultMerger: ResultMerger;
  private providers: Map<string, ModelProvider>;

  constructor(providers: ModelProvider[]) {
    this.decomposer = new TaskDecomposer();
    this.classifier = new SubtaskClassifier();
    this.modelSelector = new ModelSelector();
    this.resultMerger = new ResultMerger();
    this.providers = new Map();

    for (const provider of providers) {
      this.providers.set(provider.id, provider);
    }
  }

  /**
   * Execute a task using multi-agent approach
   */
  async executeTask(task: string, context?: string): Promise<string> {
    logger.info({ task }, 'Starting multi-agent execution');

    // Step 1: Decompose task
    let plan = await this.decomposer.decompose(task, context);
    logger.info({ subtaskCount: plan.subtasks.length }, 'Task decomposed');

    // Step 2: Classify subtasks
    plan.subtasks = this.classifier.classifyAll(plan.subtasks);

    // Step 3: Assign models
    plan.subtasks = this.modelSelector.assignModels(plan.subtasks);

    // Step 4: Execute subtasks (respecting dependencies)
    plan.status = 'executing';
    const executedPlan = await this.executeSubtasks(plan);

    // Step 5: Merge results
    const result = this.resultMerger.mergeResults(executedPlan);
    logger.info('Multi-agent execution completed');

    return result;
  }

  /**
   * Execute subtasks with dependency resolution
   */
  private async executeSubtasks(plan: TaskPlan): Promise<TaskPlan> {
    const executed = [...plan.subtasks];
    const completed = new Set<string>();

    while (completed.size < plan.subtasks.length) {
      // Find executable subtasks (all dependencies satisfied)
      const executable = executed.filter(st =>
        st.status === 'pending' &&
        st.dependencies.every(dep => completed.has(dep))
      );

      if (executable.length === 0) {
        // Check for circular dependencies or stuck tasks
        const pending = executed.filter(st => st.status === 'pending');
        if (pending.length > 0) {
          logger.warn({ stuckTasks: pending.map(t => t.id) }, 'Tasks stuck - likely circular dependency');
          for (const task of pending) {
            task.status = 'failed';
            task.error = 'Circular dependency or unresolved dependencies';
            completed.add(task.id);
          }
          continue;
        }
        break; // All tasks processed
      }

      // Execute ready tasks in parallel
      await Promise.all(executable.map(st => this.executeSingleSubtask(st)));

      // Mark as completed
      for (const task of executable) {
        completed.add(task.id);
      }
    }

    plan.status = 'completed';
    return plan;
  }

  /**
   * Execute a single subtask
   */
  private async executeSingleSubtask(subtask: Subtask): Promise<void> {
    subtask.status = 'in_progress';
    subtask.startedAt = new Date();

    try {
      // Get assigned provider
      const modelId = subtask.assignedModel || 'deepseek-v3';
      const providerId = modelId.split('-')[0] || 'deepseek'; // Extract provider from model ID
      const provider = this.providers.get(providerId);

      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      // TODO: Execute with provider
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, 100));

      subtask.result = `Simulated result for ${subtask.description}`;
      subtask.status = 'completed';
      subtask.completedAt = new Date();

      logger.debug({ subtaskId: subtask.id }, 'Subtask completed');
    } catch (error) {
      subtask.status = 'failed';
      subtask.error = error instanceof Error ? error.message : String(error);
      subtask.completedAt = new Date();

      logger.error({ subtaskId: subtask.id, error }, 'Subtask failed');
    }
  }

  /**
   * Update model preferences
   */
  setModelPreferences(preferences: Partial<ModelPreferences>): void {
    this.modelSelector.setPreferences(preferences);
  }
}

/**
 * Factory function to create orchestrator
 */
export function createOrchestrator(providers: ModelProvider[]): OrchestratorAgent {
  return new OrchestratorAgent(providers);
}

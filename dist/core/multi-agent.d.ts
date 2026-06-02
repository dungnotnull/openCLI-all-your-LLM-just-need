/**
 * Multi-Agent Task Router System
 *
 * Decomposes complex tasks into subtasks, routes to specialized models,
 * and coordinates execution across multiple agents.
 */
import type { ModelProvider } from '../types/index.js';
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
    parentTask?: string;
    dependencies: string[];
    assignedModel?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: any;
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
    code: string;
    text: string;
    search: string;
    test: string;
    analysis: string;
    orchestrator: string;
}
/**
 * Default model preferences (cost-optimized)
 */
export declare const DEFAULT_MODEL_PREFERENCES: ModelPreferences;
/**
 * Task Decomposer
 *
 * Uses LLM to break down complex tasks into executable subtasks.
 */
export declare class TaskDecomposer {
    /**
     * Decompose a task into subtasks
     */
    decompose(task: string, context?: string): Promise<TaskPlan>;
    /**
     * Simple heuristic-based task decomposition
     * (Fallback when LLM is not available)
     */
    private heuristicDecompose;
    private generateId;
}
/**
 * Subtask Classifier
 *
 * Classifies subtasks by type using rule-based + LLM hybrid approach.
 */
export declare class SubtaskClassifier {
    /**
     * Classify a subtask by type
     */
    classify(subtask: Subtask): SubtaskType;
    /**
     * Classify multiple subtasks
     */
    classifyAll(subtasks: Subtask[]): Subtask[];
}
/**
 * Model Selector
 *
 * Selects the best model for each subtask type.
 */
export declare class ModelSelector {
    private preferences;
    constructor(preferences?: Partial<ModelPreferences>);
    /**
     * Select model for a subtask
     */
    selectModel(subtask: Subtask): string;
    /**
     * Assign models to all subtasks
     */
    assignModels(subtasks: Subtask[]): Subtask[];
    /**
     * Update model preferences
     */
    setPreferences(preferences: Partial<ModelPreferences>): void;
    /**
     * Get current preferences
     */
    getPreferences(): ModelPreferences;
}
/**
 * Result Merger
 *
 * Combines outputs from multiple sub-agents into coherent response.
 */
export declare class ResultMerger {
    /**
     * Merge results from completed subtasks
     */
    mergeResults(plan: TaskPlan): string;
    /**
     * Merge code results specifically
     */
    mergeCodeResults(plan: TaskPlan): string;
}
/**
 * Orchestrator Agent
 *
 * Coordinates multi-agent execution, manages dependencies, and tracks progress.
 */
export declare class OrchestratorAgent {
    private decomposer;
    private classifier;
    private modelSelector;
    private resultMerger;
    private providers;
    constructor(providers: ModelProvider[]);
    /**
     * Execute a task using multi-agent approach
     */
    executeTask(task: string, context?: string): Promise<string>;
    /**
     * Execute subtasks with dependency resolution
     */
    private executeSubtasks;
    /**
     * Execute a single subtask
     */
    private executeSingleSubtask;
    /**
     * Update model preferences
     */
    setModelPreferences(preferences: Partial<ModelPreferences>): void;
}
/**
 * Factory function to create orchestrator
 */
export declare function createOrchestrator(providers: ModelProvider[]): OrchestratorAgent;
//# sourceMappingURL=multi-agent.d.ts.map
/**
 * Knowledge Brain Manager
 *
 * Main interface for the self-improving knowledge system.
 * Manages crawling, parsing, embedding, and retrieval of knowledge.
 */
import type { KnowledgeEntry, KnowledgeBrainConfig, KnowledgeSearchResult, CrawlSource } from './types.js';
/**
 * Knowledge brain manager
 */
export declare class KnowledgeBrain {
    private config;
    private embedder;
    private entries;
    private vectorStore;
    private initialized;
    constructor(config?: Partial<KnowledgeBrainConfig>);
    /**
     * Initialize the knowledge brain
     */
    initialize(): Promise<void>;
    /**
     * Run knowledge crawl
     */
    crawl(sources?: CrawlSource[]): Promise<number>;
    /**
     * Search knowledge for relevant entries
     */
    search(query: string, limit?: number): Promise<KnowledgeSearchResult[]>;
    /**
     * Get knowledge entries relevant to a task
     */
    getRelevantForTask(task: string, limit?: number): Promise<KnowledgeEntry[]>;
    /**
     * Inject relevant knowledge into system prompt
     */
    injectIntoSystemPrompt(systemPrompt: string, task: string): Promise<string>;
    /**
     * Create knowledge entry from raw content and parsed data
     */
    private createEntry;
    /**
     * Generate unique ID for entry
     */
    private generateId;
    /**
     * Simple hash function for IDs
     */
    private simpleHash;
    /**
     * Load entries from storage (SECOND-KNOWLEDGE-BRAIN.md)
     */
    private loadFromStorage;
    /**
     * Save entries to storage
     */
    private saveToStorage;
    /**
     * Format entries as markdown (per CLAUDE.md spec)
     */
    private formatAsMarkdown;
    /**
     * Get statistics
     */
    getStats(): {
        totalEntries: number;
        byCategory: Record<string, number>;
        config: KnowledgeBrainConfig;
    };
    /**
     * Get entry counts by category
     */
    private getCategoryCounts;
}
/**
 * Get or create knowledge brain instance
 */
export declare function getKnowledgeBrain(config?: Partial<KnowledgeBrainConfig>): KnowledgeBrain;
//# sourceMappingURL=knowledge-brain.d.ts.map
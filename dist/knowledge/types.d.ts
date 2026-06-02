/**
 * Knowledge Brain Types
 *
 * Defines interfaces for the self-improving knowledge corpus system.
 * Stores research papers, documentation, and insights for agent enhancement.
 */
/**
 * Knowledge entry from crawled content
 */
export interface KnowledgeEntry {
    id: string;
    title: string;
    source: string;
    category: KnowledgeCategory;
    keyInsight: string;
    relevance: string;
    appliedIn?: string;
    crawledAt: Date;
    embedding?: number[];
}
/**
 * Knowledge categories for organization
 */
export type KnowledgeCategory = 'CONTEXT-COMPRESSION' | 'MULTI-AGENT' | 'TOOL-USE' | 'MEMORY-SYSTEMS' | 'OPEN-SOURCE-MODELS' | 'CLI-ARCHITECTURE' | 'BENCHMARKS' | 'PROVIDER-INTEGRATION';
/**
 * Crawl source configuration
 */
export interface CrawlSource {
    id: string;
    type: CrawlSourceType;
    url: string;
    query?: string;
    schedule?: CronSchedule;
    enabled: boolean;
}
export type CrawlSourceType = 'arxiv' | 'huggingface' | 'github-releases' | 'papers-with-code' | 'documentation';
export type CronSchedule = {
    frequency: 'daily' | 'weekly' | 'monthly';
    hour?: number;
    dayOfWeek?: number;
};
/**
 * Crawled content before parsing
 */
export interface RawContent {
    source: CrawlSource;
    url: string;
    title: string;
    content: string;
    crawledAt: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Parsed knowledge entry ready for storage
 */
export interface ParsedEntry {
    category: KnowledgeCategory;
    keyInsight: string;
    relevance: string;
    appliedIn?: string;
}
/**
 * Knowledge search result
 */
export interface KnowledgeSearchResult {
    entry: KnowledgeEntry;
    score: number;
    reason: string;
}
/**
 * Knowledge brain configuration
 */
export interface KnowledgeBrainConfig {
    storagePath: string;
    indexPath: string;
    maxEntries: number;
    crawlSources: CrawlSource[];
    autoCrawlEnabled: boolean;
}
/**
 * Embedder interface for vectorization
 */
export interface Embedder {
    /**
     * Generate embedding for text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Get embedding dimension
     */
    dimension: number;
}
/**
 * Vector store interface for semantic search
 */
export interface VectorStore {
    /**
     * Add entry to index
     */
    addEntry(entry: KnowledgeEntry): Promise<void>;
    /**
     * Search for similar entries
     */
    search(query: string, limit: number): Promise<KnowledgeSearchResult[]>;
    /**
     * Delete entry from index
     */
    deleteEntry(id: string): Promise<void>;
    /**
     * Clear all entries
     */
    clear(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map
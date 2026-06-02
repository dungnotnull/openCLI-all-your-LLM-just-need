/**
 * Vector Store for Semantic Search
 *
 * In-memory implementation with cosine similarity.
 * Can be upgraded to hnswlib-node for better performance.
 */
import type { VectorStore, KnowledgeEntry, KnowledgeSearchResult } from './types.js';
/**
 * In-memory vector store
 * Stores embeddings and provides semantic search
 */
export declare class InMemoryVectorStore implements VectorStore {
    private entries;
    private embedder;
    constructor();
    /**
     * Add entry to index
     */
    addEntry(entry: KnowledgeEntry): Promise<void>;
    /**
     * Search for similar entries
     */
    search(query: string, limit?: number): Promise<KnowledgeSearchResult[]>;
    /**
     * Delete entry from index
     */
    deleteEntry(id: string): Promise<void>;
    /**
     * Clear all entries
     */
    clear(): Promise<void>;
    /**
     * Get human-readable match reason
     */
    private getMatchReason;
    /**
     * Get statistics
     */
    getStats(): {
        totalEntries: number;
        byCategory: Record<string, number>;
    };
    /**
     * Get entry counts by category
     */
    private getCategoryCounts;
    /**
     * Export all entries
     */
    exportEntries(): KnowledgeEntry[];
    /**
     * Import entries in batch
     */
    importEntries(entries: KnowledgeEntry[]): Promise<void>;
}
/**
 * HNSW Vector Store (higher performance)
 *
 * NOTE: Requires hnswlib-node to be installed:
 * npm install hnswlib-node
 *
 * This is a placeholder for the HNSW implementation.
 * When ready, replace InMemoryVectorStore with this implementation.
 */
export declare class HNSWVectorStore implements VectorStore {
    private entries;
    private embedder;
    private index;
    private dimension;
    constructor(dimension?: number);
    /**
     * Initialize HNSW index
     */
    initialize(): Promise<void>;
    addEntry(entry: KnowledgeEntry): Promise<void>;
    search(query: string, limit?: number): Promise<KnowledgeSearchResult[]>;
    deleteEntry(id: string): Promise<void>;
    clear(): Promise<void>;
    private ensureInitialized;
    getStats(): {
        totalEntries: number;
        type: string;
        dimension: number;
    };
}
/**
 * Factory function to create vector store
 */
export declare function createVectorStore(useHNSW?: boolean): VectorStore;
/**
 * Get or create vector store instance
 */
export declare function getVectorStore(useHNSW?: boolean): VectorStore;
//# sourceMappingURL=vector-store.d.ts.map
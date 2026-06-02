/**
 * Vector Store for Semantic Search
 *
 * In-memory implementation with cosine similarity.
 * Can be upgraded to hnswlib-node for better performance.
 */

import type { VectorStore, KnowledgeEntry, KnowledgeSearchResult } from './types.js';
import { getEmbedder, TransformerEmbedder } from './embedder.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory vector store
 * Stores embeddings and provides semantic search
 */
export class InMemoryVectorStore implements VectorStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private embedder: TransformerEmbedder;

  constructor() {
    this.embedder = getEmbedder();
  }

  /**
   * Add entry to index
   */
  async addEntry(entry: KnowledgeEntry): Promise<void> {
    // Ensure embedding exists
    if (!entry.embedding) {
      const textToEmbed = `${entry.title} ${entry.keyInsight} ${entry.relevance}`;
      entry.embedding = await this.embedder.embed(textToEmbed);
    }

    this.entries.set(entry.id, entry);
    logger.debug({ entryId: entry.id }, 'Entry added to vector store');
  }

  /**
   * Search for similar entries
   */
  async search(query: string, limit: number = 5): Promise<KnowledgeSearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embedder.embed(query);

    // Calculate similarity scores for all entries
    const results: KnowledgeSearchResult[] = [];

    for (const entry of this.entries.values()) {
      if (!entry.embedding) {
        continue;
      }

      const similarity = TransformerEmbedder.cosineSimilarity(queryEmbedding, entry.embedding);

      // Only include results with meaningful similarity
      if (similarity > 0.1) {
        results.push({
          entry,
          score: similarity,
          reason: this.getMatchReason(entry, similarity),
        });
      }
    }

    // Sort by score (descending) and return top results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Delete entry from index
   */
  async deleteEntry(id: string): Promise<void> {
    const deleted = this.entries.delete(id);
    if (deleted) {
      logger.debug({ entryId: id }, 'Entry deleted from vector store');
    }
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    const count = this.entries.size;
    this.entries.clear();
    logger.info({ count }, 'Vector store cleared');
  }

  /**
   * Get human-readable match reason
   */
  private getMatchReason(entry: KnowledgeEntry, score: number): string {
    if (score > 0.8) {
      return `Very high relevance to "${entry.title}"`;
    } else if (score > 0.6) {
      return `High relevance to "${entry.title}"`;
    } else if (score > 0.4) {
      return `Moderate relevance to "${entry.title}"`;
    } else {
      return `Some relevance to "${entry.title}"`;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalEntries: this.entries.size,
      byCategory: this.getCategoryCounts(),
    };
  }

  /**
   * Get entry counts by category
   */
  private getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const entry of this.entries.values()) {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Export all entries
   */
  exportEntries(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Import entries in batch
   */
  async importEntries(entries: KnowledgeEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.addEntry(entry);
    }
    logger.info({ count: entries.length }, 'Entries imported to vector store');
  }
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
export class HNSWVectorStore implements VectorStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private embedder: TransformerEmbedder;
  private index: any = null; // HNSW index
  private dimension: number;

  constructor(dimension: number = 384) {
    this.dimension = dimension;
    this.embedder = getEmbedder();
  }

  /**
   * Initialize HNSW index
   */
  async initialize(): Promise<void> {
    // TODO: Implement HNSW initialization
    // import { HNSWLib } from 'hnswlib-node';
    //
    // this.index = new HNSWLib(this.space, this.dimension);
    // this.index.initIndex(maxElements);

    logger.info('HNSW Vector Store initialized');
  }

  async addEntry(entry: KnowledgeEntry): Promise<void> {
    // TODO: Implement HNSW add
    await this.ensureInitialized();

    if (!entry.embedding) {
      const textToEmbed = `${entry.title} ${entry.keyInsight} ${entry.relevance}`;
      entry.embedding = await this.embedder.embed(textToEmbed);
    }

    this.entries.set(entry.id, entry);
    // this.index.addPoint(entry.embedding, this.entries.size - 1);
  }

  async search(query: string, limit: number = 5): Promise<KnowledgeSearchResult[]> {
    await this.ensureInitialized();

    const queryEmbedding = await this.embedder.embed(query);

    // TODO: Implement HNSW search
    // const results = this.index.searchKnn(queryEmbedding, limit);

    // Fallback to in-memory for now
    const results: KnowledgeSearchResult[] = [];

    for (const entry of this.entries.values()) {
      if (!entry.embedding) {
        continue;
      }

      const similarity = TransformerEmbedder.cosineSimilarity(queryEmbedding, entry.embedding);

      if (similarity > 0.1) {
        results.push({
          entry,
          score: similarity,
          reason: `Similarity: ${similarity.toFixed(2)}`,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async deleteEntry(id: string): Promise<void> {
    this.entries.delete(id);
    // TODO: Mark as deleted in HNSW index
  }

  async clear(): Promise<void> {
    this.entries.clear();
    // TODO: Clear HNSW index
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }
  }

  getStats() {
    return {
      totalEntries: this.entries.size,
      type: 'HNSW',
      dimension: this.dimension,
    };
  }
}

/**
 * Factory function to create vector store
 */
export function createVectorStore(useHNSW: boolean = false): VectorStore {
  if (useHNSW) {
    return new HNSWVectorStore();
  }
  return new InMemoryVectorStore();
}

/**
 * Singleton instance
 */
let vectorStoreInstance: VectorStore | null = null;

/**
 * Get or create vector store instance
 */
export function getVectorStore(useHNSW: boolean = false): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = createVectorStore(useHNSW);
  }
  return vectorStoreInstance;
}

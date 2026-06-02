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
  source: string; // URL or repository
  category: KnowledgeCategory;
  keyInsight: string; // One-sentence distillation
  relevance: string; // How this applies to OpenCLI
  appliedIn?: string; // File path if already implemented
  crawledAt: Date;
  embedding?: number[]; // Vector embedding for semantic search
}

/**
 * Knowledge categories for organization
 */
export type KnowledgeCategory =
  | 'CONTEXT-COMPRESSION'
  | 'MULTI-AGENT'
  | 'TOOL-USE'
  | 'MEMORY-SYSTEMS'
  | 'OPEN-SOURCE-MODELS'
  | 'CLI-ARCHITECTURE'
  | 'BENCHMARKS'
  | 'PROVIDER-INTEGRATION';

/**
 * Crawl source configuration
 */
export interface CrawlSource {
  id: string;
  type: CrawlSourceType;
  url: string;
  query?: string; // For arXiv, API queries
  schedule?: CronSchedule; // When to crawl
  enabled: boolean;
}

export type CrawlSourceType =
  | 'arxiv'
  | 'huggingface'
  | 'github-releases'
  | 'papers-with-code'
  | 'documentation';

export type CronSchedule = {
  frequency: 'daily' | 'weekly' | 'monthly';
  hour?: number; // 0-23
  dayOfWeek?: number; // 0-6 (Sunday = 0)
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
  score: number; // Similarity score (0-1)
  reason: string; // Why this result matched
}

/**
 * Knowledge brain configuration
 */
export interface KnowledgeBrainConfig {
  storagePath: string; // Path to SECOND-KNOWLEDGE-BRAIN.md
  indexPath: string; // Path to vector index
  maxEntries: number; // Maximum entries to keep
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

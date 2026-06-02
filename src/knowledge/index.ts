/**
 * Knowledge Brain Module
 *
 * Self-improving knowledge corpus for OpenCLI.
 * Crawls, parses, and retrieves research papers and documentation.
 */

// Types
export type {
  KnowledgeEntry,
  KnowledgeCategory,
  CrawlSource,
  CrawlSourceType,
  CronSchedule,
  RawContent,
  ParsedEntry,
  KnowledgeSearchResult,
  KnowledgeBrainConfig,
  Embedder,
  VectorStore,
} from './types.js';

// Crawler
export {
  ArXivCrawler,
  HuggingFaceCrawler,
  GitHubReleasesCrawler,
  PapersWithCodeCrawler,
  getCrawler,
  crawlSources,
  getDefaultCrawlSources,
} from './crawler.js';
export type { Crawler } from './crawler.js';

// Parser
export {
  parseContent,
  parseBatch,
  extractCategoryFromText,
  generateParsingPrompt,
} from './parser.js';
export type { ParseResult, ParserOptions } from './parser.js';

// Embedder
export { TransformerEmbedder, getEmbedder } from './embedder.js';

// Knowledge Brain
export { KnowledgeBrain, getKnowledgeBrain } from './knowledge-brain.js';

// Updater
export {
  KnowledgeUpdater,
  getKnowledgeUpdater,
  setupDefaultTasks,
} from './updater.js';
export type { UpdateTask, UpdaterStatus } from './updater.js';

// Vector Store
export {
  InMemoryVectorStore,
  HNSWVectorStore,
  createVectorStore,
  getVectorStore,
} from './vector-store.js';

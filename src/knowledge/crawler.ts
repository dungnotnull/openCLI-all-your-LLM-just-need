/**
 * Knowledge Crawler
 *
 * Crawls arXiv, HuggingFace, GitHub releases, and other sources
 * for research papers and documentation relevant to coding agents.
 */

import type { CrawlSource, CrawlSourceType, RawContent } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Base crawler interface
 */
export interface Crawler {
  type: CrawlSourceType;
  crawl(source: CrawlSource): Promise<RawContent[]>;
}

/**
 * arXiv crawler for AI/SE papers
 */
export class ArXivCrawler implements Crawler {
  type = 'arxiv' as const;

  async crawl(source: CrawlSource): Promise<RawContent[]> {
    logger.info({ source: source.id }, 'Crawling arXiv');

    // TODO: Implement arXiv API integration
    // Query cs.AI, cs.SE for papers related to:
    // - Context compression
    // - Multi-agent systems
    // - Tool use
    // - Memory systems
    // - Open-source models

    return [];
  }

  /**
   * Build arXiv API query from keywords
   */
  private buildQuery(keywords: string[]): string {
    // arXiv API query syntax: cat:cs.AI AND cat:cs.SE AND all:tool+use
    return keywords.join(' AND ');
  }
}

/**
 * HuggingFace Papers crawler for model releases
 */
export class HuggingFaceCrawler implements Crawler {
  type = 'huggingface' as const;

  async crawl(source: CrawlSource): Promise<RawContent[]> {
    logger.info({ source: source.id }, 'Crawling HuggingFace Papers');

    // TODO: Implement HuggingFace Papers API integration
    // Track new model releases for:
    // - DeepSeek
    // - Qwen
    // - Minimax
    // - GLM
    // - Kimi
    // - Mistral/Devstral

    return [];
  }
}

/**
 * GitHub releases crawler
 */
export class GitHubReleasesCrawler implements Crawler {
  type = 'github-releases' as const;

  async crawl(source: CrawlSource): Promise<RawContent[]> {
    logger.info({ source: source.id }, 'Crawling GitHub releases');

    // TODO: Implement GitHub Releases API integration
    // Repositories to track:
    // - deepseek-ai/DeepSeek
    // - QwenLM/Qwen
    // - MinimaxAI/minimax
    // - THUDM/GLM
    // - MoonshotAI/Kimi

    return [];
  }
}

/**
 * Papers With Code crawler for SWE-bench leaderboard
 */
export class PapersWithCodeCrawler implements Crawler {
  type = 'papers-with-code' as const;

  async crawl(source: CrawlSource): Promise<RawContent[]> {
    logger.info({ source: source.id }, 'Crawling Papers With Code');

    // TODO: Implement Papers With Code scraping
    // Track SOTA results on:
    // - SWE-bench
    // - Code generation benchmarks
    // - Tool use benchmarks

    return [];
  }
}

/**
 * Crawler registry
 */
const crawlerRegistry: Record<CrawlSourceType, Crawler> = {
  arxiv: new ArXivCrawler(),
  huggingface: new HuggingFaceCrawler(),
  'github-releases': new GitHubReleasesCrawler(),
  'papers-with-code': new PapersWithCodeCrawler(),
  documentation: {} as any, // TODO: Implement documentation crawler
};

/**
 * Get crawler for source type
 */
export function getCrawler(type: CrawlSourceType): Crawler {
  const crawler = crawlerRegistry[type];
  if (!crawler) {
    throw new Error(`Unknown crawler type: ${type}`);
  }
  return crawler;
}

/**
 * Crawl multiple sources and aggregate results
 */
export async function crawlSources(sources: CrawlSource[]): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const source of sources) {
    if (!source.enabled) {
      continue;
    }

    try {
      const crawler = getCrawler(source.type);
      const content = await crawler.crawl(source);
      results.push(...content);
    } catch (error) {
      logger.error({ source, error }, 'Failed to crawl source');
    }
  }

  return results;
}

/**
 * Default crawl sources for OpenCLI
 */
export function getDefaultCrawlSources(): CrawlSource[] {
  return [
    {
      id: 'arxiv-ai-agents',
      type: 'arxiv',
      url: 'https://arxiv.org',
      query: 'cat:cs.AI AND (all:agent OR all:tool+use OR all:LLM)',
      schedule: { frequency: 'daily', hour: 2 },
      enabled: true,
    },
    {
      id: 'arxiv-context-compression',
      type: 'arxiv',
      url: 'https://arxiv.org',
      query: 'cat:cs.AI AND all:context+compression',
      schedule: { frequency: 'weekly', dayOfWeek: 0, hour: 2 },
      enabled: true,
    },
    {
      id: 'huggingface-models',
      type: 'huggingface',
      url: 'https://huggingface.co/papers',
      schedule: { frequency: 'daily', hour: 3 },
      enabled: true,
    },
    {
      id: 'github-deepseek',
      type: 'github-releases',
      url: 'https://github.com/deepseek-ai/DeepSeek',
      schedule: { frequency: 'daily', hour: 4 },
      enabled: true,
    },
    {
      id: 'swe-bench',
      type: 'papers-with-code',
      url: 'https://paperswithcode.com/sota/code-generation-on-swe-bench',
      schedule: { frequency: 'weekly', dayOfWeek: 1, hour: 2 },
      enabled: true,
    },
  ];
}

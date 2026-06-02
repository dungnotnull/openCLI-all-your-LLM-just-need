/**
 * Knowledge Crawler
 *
 * Crawls arXiv, HuggingFace, GitHub releases, and other sources
 * for research papers and documentation relevant to coding agents.
 */
import type { CrawlSource, CrawlSourceType, RawContent } from './types.js';
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
export declare class ArXivCrawler implements Crawler {
    type: "arxiv";
    crawl(source: CrawlSource): Promise<RawContent[]>;
    /**
     * Build arXiv API query from keywords
     */
    private buildQuery;
}
/**
 * HuggingFace Papers crawler for model releases
 */
export declare class HuggingFaceCrawler implements Crawler {
    type: "huggingface";
    crawl(source: CrawlSource): Promise<RawContent[]>;
}
/**
 * GitHub releases crawler
 */
export declare class GitHubReleasesCrawler implements Crawler {
    type: "github-releases";
    crawl(source: CrawlSource): Promise<RawContent[]>;
}
/**
 * Papers With Code crawler for SWE-bench leaderboard
 */
export declare class PapersWithCodeCrawler implements Crawler {
    type: "papers-with-code";
    crawl(source: CrawlSource): Promise<RawContent[]>;
}
/**
 * Get crawler for source type
 */
export declare function getCrawler(type: CrawlSourceType): Crawler;
/**
 * Crawl multiple sources and aggregate results
 */
export declare function crawlSources(sources: CrawlSource[]): Promise<RawContent[]>;
/**
 * Default crawl sources for OpenCLI
 */
export declare function getDefaultCrawlSources(): CrawlSource[];
//# sourceMappingURL=crawler.d.ts.map
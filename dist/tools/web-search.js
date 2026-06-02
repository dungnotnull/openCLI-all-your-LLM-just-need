/**
 * Web Search Tool
 *
 * Performs web searches using Brave Search or Serper API.
 * Returns search results with snippets and URLs.
 */
import { Tool } from '../types/index.js';
import { logger } from '../utils/logger.js';
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    provider: 'brave',
    apiKey: process.env.BRAVE_SEARCH_API_KEY || process.env.SERPER_API_KEY || '',
    count: 5,
};
/**
 * Web Search Tool Class
 */
export class WebSearchTool extends Tool {
    name = 'web_search';
    description = 'Search the web for information using Brave Search or Serper API';
    inputSchema = {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query to execute',
            },
            numResults: {
                type: 'number',
                description: 'Number of results to return (default: 5, max: 10)',
            },
        },
        required: ['query'],
    };
    config;
    constructor(config) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Execute web search
     */
    async execute(input) {
        if (!input.query || typeof input.query !== 'string') {
            return {
                toolCallId: '',
                content: 'Error: query is required and must be a string',
                isError: true,
            };
        }
        const { query, numResults = 5 } = input;
        logger.info({ query, numResults }, 'Executing web search');
        try {
            const results = await this.performSearch(query, Math.min(numResults, 10));
            const formatted = this.formatResults(results);
            return {
                toolCallId: '',
                content: formatted,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ error, query }, 'Web search failed');
            return {
                toolCallId: '',
                content: `Search failed: ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Perform search using configured provider
     */
    async performSearch(query, count) {
        if (this.config.provider === 'brave') {
            return await this.searchBrave(query, count);
        }
        else {
            return await this.searchSerper(query, count);
        }
    }
    /**
     * Search using Brave Search API
     */
    async searchBrave(query, count) {
        // TODO: Implement Brave Search API call
        // Endpoint: https://api.search.brave.com/res/v1/web/search
        // Headers: X-Subscription-Token: <apiKey>
        // Query params: q={query}, count={count}
        logger.info('Using Brave Search API');
        // Placeholder results
        return [
            {
                title: `Search results for: ${query}`,
                url: 'https://example.com',
                snippet: 'This is a placeholder. Web search requires API key configuration.',
            },
        ];
    }
    /**
     * Search using Serper.dev API
     */
    async searchSerper(query, count) {
        // TODO: Implement Serper API call
        // Endpoint: https://google.serper.dev/search
        // Headers: X-API-KEY: <apiKey>
        // Body: { q: query, num: count }
        logger.info('Using Serper API');
        // Placeholder results
        return [
            {
                title: `Search results for: ${query}`,
                url: 'https://example.com',
                snippet: 'This is a placeholder. Web search requires API key configuration.',
            },
        ];
    }
    /**
     * Format search results for display
     */
    formatResults(results) {
        if (results.length === 0) {
            return 'No results found.';
        }
        const lines = [];
        lines.push(`Found ${results.length} results:\n`);
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            lines.push(`${i + 1}. ${result.title}`);
            lines.push(`   ${result.url}`);
            lines.push(`   ${result.snippet}\n`);
        }
        return lines.join('\n');
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=web-search.js.map
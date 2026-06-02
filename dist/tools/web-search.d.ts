/**
 * Web Search Tool
 *
 * Performs web searches using Brave Search or Serper API.
 * Returns search results with snippets and URLs.
 */
import { Tool, ToolResult } from '../types/index.js';
/**
 * Web search configuration
 */
interface WebSearchConfig {
    provider: 'brave' | 'serper';
    apiKey: string;
    count?: number;
}
/**
 * Web Search Tool Class
 */
export declare class WebSearchTool extends Tool {
    readonly name = "web_search";
    readonly description = "Search the web for information using Brave Search or Serper API";
    readonly inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            numResults: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    private config;
    constructor(config?: Partial<WebSearchConfig>);
    /**
     * Execute web search
     */
    execute(input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Perform search using configured provider
     */
    private performSearch;
    /**
     * Search using Brave Search API
     */
    private searchBrave;
    /**
     * Search using Serper.dev API
     */
    private searchSerper;
    /**
     * Format search results for display
     */
    private formatResults;
    /**
     * Update configuration
     */
    setConfig(config: Partial<WebSearchConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): WebSearchConfig;
}
export {};
//# sourceMappingURL=web-search.d.ts.map
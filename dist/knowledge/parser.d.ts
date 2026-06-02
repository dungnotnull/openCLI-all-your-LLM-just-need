/**
 * Knowledge Parser
 *
 * Uses LLM to extract key insights from research papers and documentation.
 * Prioritizes cheap models (DeepSeek V2.5 Lite) for cost efficiency.
 */
import type { RawContent, ParsedEntry, KnowledgeCategory } from './types.js';
/**
 * Parse result with confidence score
 */
export interface ParseResult {
    entry: ParsedEntry;
    confidence: number;
}
/**
 * Paper parser options
 */
export interface ParserOptions {
    model?: string;
    maxContentLength?: number;
    includeFullText?: boolean;
}
/**
 * Parse raw content into knowledge entry
 */
export declare function parseContent(content: RawContent, options?: ParserOptions): Promise<ParseResult>;
/**
 * Parse multiple contents in batch
 */
export declare function parseBatch(contents: RawContent[], options?: ParserOptions): Promise<ParseResult[]>;
/**
 * Extract category from text using keyword matching
 * Fallback method when LLM parsing is not available
 */
export declare function extractCategoryFromText(text: string): KnowledgeCategory;
/**
 * Generate parsing prompt for LLM
 */
export declare function generateParsingPrompt(content: RawContent): string;
//# sourceMappingURL=parser.d.ts.map
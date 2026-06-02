/**
 * Knowledge Parser
 *
 * Uses LLM to extract key insights from research papers and documentation.
 * Prioritizes cheap models (DeepSeek V2.5 Lite) for cost efficiency.
 */

import type { RawContent, ParsedEntry, KnowledgeCategory } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Parse result with confidence score
 */
export interface ParseResult {
  entry: ParsedEntry;
  confidence: number; // 0-1
}

/**
 * Paper parser options
 */
export interface ParserOptions {
  model?: string; // Model to use for parsing (default: deepseek-lite)
  maxContentLength?: number; // Truncate content if too long
  includeFullText?: boolean; // Include full text in result
}

/**
 * Parse raw content into knowledge entry
 */
export async function parseContent(
  content: RawContent,
  options: ParserOptions = {}
): Promise<ParseResult> {
  const {
    maxContentLength = 10000,
    includeFullText = false,
  } = options;

  // Truncate content if necessary
  const textToParse = content.content.length > maxContentLength
    ? content.content.slice(0, maxContentLength) + '...'
    : content.content;

  logger.info({ source: content.source.id, title: content.title }, 'Parsing content');

  // TODO: Implement LLM-based parsing
  // Use DeepSeek V2.5 Lite for cost efficiency
  // Prompt:
  // "Extract the key insight from this paper in one sentence.
  //  Then explain how this applies to OpenCLI (a coding agent CLI).
  //  Categorize as one of: CONTEXT-COMPRESSION, MULTI-AGENT, TOOL-USE, MEMORY-SYSTEMS,
  //  OPEN-SOURCE-MODELS, CLI-ARCHITECTURE, BENCHMARKS, PROVIDER-INTEGRATION."

  // For now, return a placeholder
  return {
    entry: {
      category: 'OPEN-SOURCE-MODELS',
      keyInsight: 'Key insight extraction not yet implemented',
      relevance: 'This content needs to be parsed with an LLM',
    },
    confidence: 0.0,
  };
}

/**
 * Parse multiple contents in batch
 */
export async function parseBatch(
  contents: RawContent[],
  options: ParserOptions = {}
): Promise<ParseResult[]> {
  const results: ParseResult[] = [];

  for (const content of contents) {
    try {
      const result = await parseContent(content, options);
      results.push(result);
    } catch (error) {
      logger.error({ content: content.title, error }, 'Failed to parse content');
    }
  }

  return results;
}

/**
 * Extract category from text using keyword matching
 * Fallback method when LLM parsing is not available
 */
export function extractCategoryFromText(text: string): KnowledgeCategory {
  const lower = text.toLowerCase();

  const categoryKeywords: Record<KnowledgeCategory, string[]> = {
    'CONTEXT-COMPRESSION': ['compression', 'compress', 'token', 'context window', 'pruning', 'acon'],
    'MULTI-AGENT': ['multi-agent', 'agent team', 'orchestrat', 'subtask', 'decomposition'],
    'TOOL-USE': ['tool use', 'function call', 'api call', 'tool execution'],
    'MEMORY-SYSTEMS': ['memory', 'episodic', 'semantic', 'vector', 'embed', 'retriev'],
    'OPEN-SOURCE-MODELS': ['open source', 'llama', 'mistral', 'deepseek', 'qwen', 'minimax'],
    'CLI-ARCHITECTURE': ['cli', 'terminal', 'command line', 'interface', 'ui'],
    'BENCHMARKS': ['benchmark', 'swe-bench', 'evaluat', 'performance', 'metric'],
    'PROVIDER-INTEGRATION': ['provider', 'api', 'integration', 'openai', 'anthropic'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as KnowledgeCategory;
      }
    }
  }

  return 'OPEN-SOURCE-MODELS'; // Default
}

/**
 * Generate parsing prompt for LLM
 */
export function generateParsingPrompt(content: RawContent): string {
  return `Analyze this research paper/documentation and extract:

**Title:** ${content.title}
**Source:** ${content.url}

**Content:**
${content.content.slice(0, 5000)}...

Respond in JSON format:
{
  "category": "CONTEXT-COMPRESSION|MULTI-AGENT|TOOL-USE|MEMORY-SYSTEMS|OPEN-SOURCE-MODELS|CLI-ARCHITECTURE|BENCHMARKS|PROVIDER-INTEGRATION",
  "keyInsight": "One sentence distillation of the main contribution",
  "relevance": "How this applies to OpenCLI (a coding agent CLI for open-source models)"
}`;
}

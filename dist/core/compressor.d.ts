/**
 * Context compression engine
 * Implements sliding-window, semantic, and adaptive compression
 * Inspired by ACON and SWE-Pruner research
 */
import type { Message, CompressionStrategy, CompressionMetrics } from '../types/index.js';
export { CompressionStrategy, CompressionMetrics } from '../types/index.js';
/**
 * Compress session messages to fit within token budget
 */
export declare function compressSession(messages: Message[], providerId: string, strategy: CompressionStrategy): Promise<Message[]>;
/**
 * Calculate compression metrics
 */
export declare function calculateCompressionMetrics(before: Message[], after: Message[], providerId: string): Promise<CompressionMetrics>;
/**
 * Get default compression strategy for a provider
 */
export declare function getDefaultCompressionStrategy(providerId: string, contextWindow: number): CompressionStrategy;
//# sourceMappingURL=compressor.d.ts.map
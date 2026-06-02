/**
 * Local Embedder
 *
 * Uses @xenova/transformers for zero-cost, local embeddings.
 * No API calls, runs entirely on-device.
 */
import type { Embedder } from './types.js';
/**
 * Local transformer embedder using @xenova/transformers
 */
export declare class TransformerEmbedder implements Embedder {
    private model;
    private pipeline;
    readonly dimension: number;
    constructor(dimension?: number);
    /**
     * Initialize the embedder (lazy loading)
     */
    initialize(): Promise<void>;
    /**
     * Generate embedding for text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Fallback hash-based embedding
     * Simple but consistent embedding for development/testing
     */
    private hashEmbedding;
    /**
     * Compute cosine similarity between two embeddings
     */
    static cosineSimilarity(a: number[], b: number[]): number;
}
/**
 * Get or create embedder instance
 */
export declare function getEmbedder(): TransformerEmbedder;
//# sourceMappingURL=embedder.d.ts.map
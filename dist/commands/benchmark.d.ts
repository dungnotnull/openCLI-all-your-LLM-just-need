/**
 * Benchmark Command
 *
 * Compares different models on the same task.
 * Shows cost, speed, and quality metrics.
 */
/**
 * Benchmark options
 */
export interface BenchmarkOptions {
    task: string;
    providers?: string[];
    metrics?: ('cost' | 'speed' | 'quality')[];
    iterations?: number;
}
/**
 * Benchmark result for a single provider
 */
export interface BenchmarkResult {
    provider: string;
    model: string;
    duration: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    quality?: number;
    success: boolean;
    error?: string;
}
/**
 * Benchmark summary
 */
export interface BenchmarkSummary {
    task: string;
    results: BenchmarkResult[];
    winner: {
        cost: string;
        speed: string;
        quality: string;
    };
    comparison: string;
}
/**
 * Run benchmark comparison
 */
export declare function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkSummary>;
/**
 * Setup benchmark command for CLI
 */
export declare function setupBenchmarkCommand(program: any): void;
//# sourceMappingURL=benchmark.d.ts.map
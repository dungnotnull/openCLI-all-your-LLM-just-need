import { describe, it, expect } from 'vitest';
import { getDefaultCompressionStrategy } from '../../../src/core/compressor';

describe('Devstral compression special handling', () => {
  it('should use 50% budget for Devstral', () => {
    const strategy = getDefaultCompressionStrategy('devstral', 32000);

    expect(strategy.maxTokenBudget).toBe(16000); // 50% of 32K
  });

  it('should use adaptive mode for Devstral', () => {
    const strategy = getDefaultCompressionStrategy('devstral', 32000);

    expect(strategy.pruningMode).toBe('adaptive');
  });

  it('should have lower priority for old tool results in Devstral', () => {
    const strategy = getDefaultCompressionStrategy('devstral', 32000);

    expect(strategy.priorityWeights.oldToolResults).toBe(0.2); // Lower than default 0.3
  });

  it('should use episodic reconstruction flag correctly for Devstral', () => {
    const strategy = getDefaultCompressionStrategy('devstral', 32000);

    expect(strategy.episodicReconstruction).toBe(false);
  });

  it('should compare Devstral strategy with default strategy', () => {
    const devstralStrategy = getDefaultCompressionStrategy('devstral', 32000);
    const defaultStrategy = getDefaultCompressionStrategy('deepseek', 32000);

    // Devstral should have more aggressive budget
    expect(devstralStrategy.maxTokenBudget).toBeLessThan(defaultStrategy.maxTokenBudget);

    // Devstral should have lower priority for old tool results
    expect(devstralStrategy.priorityWeights.oldToolResults).toBeLessThan(defaultStrategy.priorityWeights.oldToolResults);

    // Devstral uses adaptive mode, default uses sliding
    expect(devstralStrategy.pruningMode).toBe('adaptive');
    expect(defaultStrategy.pruningMode).toBe('sliding');
  });

  it('should handle different context window sizes for Devstral', () => {
    const strategy16k = getDefaultCompressionStrategy('devstral', 16000);
    const strategy64k = getDefaultCompressionStrategy('devstral', 64000);

    // Should always use 50% of whatever the context window is
    expect(strategy16k.maxTokenBudget).toBe(8000);
    expect(strategy64k.maxTokenBudget).toBe(32000);
  });

  it('should maintain system prompt priority for Devstral', () => {
    const strategy = getDefaultCompressionStrategy('devstral', 32000);

    expect(strategy.priorityWeights.systemPrompt).toBe(1.0);
    expect(strategy.priorityWeights.currentTask).toBe(1.0);
    expect(strategy.priorityWeights.recentTools).toBe(0.9);
  });
});

describe('Provider-specific compression strategies', () => {
  it('should use 95% budget for Minimax (1M context)', () => {
    const strategy = getDefaultCompressionStrategy('minimax', 1000000);

    expect(strategy.maxTokenBudget).toBe(950000); // 95% of 1M
  });

  it('should use semantic mode for Minimax', () => {
    const strategy = getDefaultCompressionStrategy('minimax', 1000000);

    expect(strategy.pruningMode).toBe('semantic');
  });

  it('should enable episodic reconstruction for Minimax', () => {
    const strategy = getDefaultCompressionStrategy('minimax', 1000000);

    expect(strategy.episodicReconstruction).toBe(true);
  });

  it('should use 80% budget for DeepSeek (default)', () => {
    const strategy = getDefaultCompressionStrategy('deepseek', 64000);

    expect(strategy.maxTokenBudget).toBe(51200); // 80% of 64K
  });

  it('should use sliding mode for DeepSeek (default)', () => {
    const strategy = getDefaultCompressionStrategy('deepseek', 64000);

    expect(strategy.pruningMode).toBe('sliding');
  });

  it('should disable episodic reconstruction for default providers', () => {
    const strategy = getDefaultCompressionStrategy('deepseek', 64000);

    expect(strategy.episodicReconstruction).toBe(false);
  });
});

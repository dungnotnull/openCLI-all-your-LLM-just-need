import { describe, it, expect } from 'vitest';
import { countTokens, estimateTokens } from '../../../src/core/tokenizer';

describe('tokenizer', () => {
  describe('countTokens', () => {
    it('should count tokens for DeepSeek using tiktoken', async () => {
      const text = 'Hello, world! This is a test.';
      const count = await countTokens('deepseek', text);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(text.length); // Tokens < chars
    });

    it('should count tokens for Qwen', async () => {
      const text = 'Write a function to sort an array.';
      const count = await countTokens('qwen', text);
      expect(count).toBeGreaterThan(0);
    });

    it('should return zero for empty text', async () => {
      const count = await countTokens('deepseek', '');
      expect(count).toBe(0);
    });

    it('should handle long texts efficiently', async () => {
      const longText = 'Hello '.repeat(1000);
      const count = await countTokens('deepseek', longText);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for unknown providers', () => {
      const text = 'This is a sample text for token estimation.';
      const estimate = estimateTokens(text);
      expect(estimate).toBeGreaterThan(0);
      // Should be roughly text.length / 1.4
      expect(estimate).toBeCloseTo(text.length / 1.4, 0);
    });

    it('should use provider-specific ratios', () => {
      const text = 'Sample text here';
      const glmEstimate = estimateTokens(text, 'glm');
      const ollamaEstimate = estimateTokens(text, 'ollama');
      // GLM uses 1.3, Ollama uses 1.5
      expect(glmEstimate).not.toBe(ollamaEstimate);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { getRate, calculateCost } from '../../../src/cost/rates';

describe('cost rates', () => {
  describe('getRate', () => {
    it('should return DeepSeek rate', () => {
      const rate = getRate('deepseek', 'deepseek-v3');
      expect(rate?.inputCostPerMillion).toBe(0.14);
      expect(rate?.outputCostPerMillion).toBe(0.28);
    });

    it('should return Ollama free rate', () => {
      const rate = getRate('ollama', 'default');
      expect(rate?.inputCostPerMillion).toBe(0);
      expect(rate?.outputCostPerMillion).toBe(0);
    });

    it('should return null for unknown provider', () => {
      const rate = getRate('unknown', 'model');
      expect(rate).toBeNull();
    });
  });

  describe('calculateCost', () => {
    it('should calculate DeepSeek cost correctly', () => {
      const cost = calculateCost('deepseek', 'deepseek-v3', 1000, 500);
      // 1000 * 0.14 / 1M + 500 * 0.28 / 1M
      expect(cost).toBeCloseTo(0.00028, 6);
    });

    it('should return zero for Ollama', () => {
      const cost = calculateCost('ollama', 'default', 10000, 5000);
      expect(cost).toBe(0);
    });
  });
});

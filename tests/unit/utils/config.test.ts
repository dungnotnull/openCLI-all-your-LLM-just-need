import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig, validateConfig, type OpenCliConfig } from '../../../src/utils/config';

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return defaults when no config file exists', async () => {
      const config = await loadConfig();
      expect(config.provider).toBe('deepseek');
      expect(config.model).toBe('deepseek-v3');
    });

    it('should parse valid config', async () => {
      const config: OpenCliConfig = {
        provider: 'qwen',
        model: 'qwen3-coder',
        budget: {
          sessionMaxUsd: 2.0,
          dailyMaxUsd: 10.0,
          monthlyMaxUsd: 100.0,
          warnAtPercent: 80,
          hardStop: true,
        },
      };

      const validated = validateConfig(config);
      expect(validated.provider).toBe('qwen');
      expect(validated.budget?.sessionMaxUsd).toBe(2.0);
    });

    it('should use defaults for missing fields', async () => {
      const config = { provider: 'minimax' };
      const validated = validateConfig(config);
      expect(validated.provider).toBe('minimax');
      expect(validated.model).toBe('deepseek-v3');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config structure', () => {
      const config: OpenCliConfig = {
        provider: 'deepseek',
        model: 'deepseek-v3',
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw on invalid provider type', () => {
      const config = { provider: 123 };
      expect(() => validateConfig(config)).toThrow();
    });
  });
});

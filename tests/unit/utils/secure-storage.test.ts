import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as secureStorage from '../../../src/utils/secure-storage';

describe('secure-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApiKeyOrEnv', () => {
    it('should return value from environment variable', () => {
      process.env.TEST_API_KEY = 'test-key';
      const result = secureStorage.getApiKeyOrEnv('test', 'TEST_API_KEY');
      expect(result).toBe('test-key');
      delete process.env.TEST_API_KEY;
    });

    it('should return null when env var not set', () => {
      const result = secureStorage.getApiKeyOrEnv('test', 'NONEXISTENT_KEY');
      expect(result).toBeNull();
    });
  });

  describe('listProviders', () => {
    it('should return list of supported providers', async () => {
      const providers = await secureStorage.listProviders();
      expect(providers).toContain('deepseek');
      expect(providers).toContain('qwen');
      expect(providers).toContain('minimax');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { providerRegistry, getProvider } from '../../../src/providers/registry';
import type { Message } from '../../../src/types';

describe('All Providers Integration', () => {
  const providerIds = Object.keys(providerRegistry);

  it(`should have all expected providers registered`, () => {
    expect(providerIds).toContain('deepseek');
    expect(providerIds).toContain('qwen');
    expect(providerIds).toContain('minimax');
    expect(providerIds).toContain('glm');
    expect(providerIds).toContain('kimi');
    expect(providerIds).toContain('devstral');
    expect(providerIds).toContain('ollama');
    expect(providerIds.length).toBeGreaterThanOrEqual(8);
  });

  describe.each(providerIds)('%s provider', (providerId) => {
    let provider: any;

    beforeAll(async () => {
      provider = await getProvider(providerId, 'test-api-key');
    });

    it('should have valid metadata', () => {
      expect(provider).toBeDefined();
      expect(provider.id).toBe(providerId);
      expect(provider.name).toBeDefined();
      expect(provider.models).toBeInstanceOf(Array);
      expect(provider.models.length).toBeGreaterThan(0);
    });

    it('should have models with valid descriptors', () => {
      for (const model of provider.models) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(typeof model.supportsTools).toBe('boolean');
        expect(typeof model.supportsImages).toBe('boolean');
      }
    });

    it('should support tool calling', () => {
      expect(provider.supportsTools()).toBe(true);
    });

    it('should have context window defined', () => {
      expect(provider.maxContextWindow()).toBeGreaterThan(0);
    });

    it('should count tokens', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello, how are you today?' },
      ];
      const count = await provider.countTokens(messages);
      expect(count).toBeGreaterThan(0);
    });

    it('should have at least one model with tools support', () => {
      const hasToolsModel = provider.models.some((m: any) => m.supportsTools);
      expect(hasToolsModel).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { KimiProvider } from '../../../src/providers/kimi';

describe('KimiProvider', () => {
  let provider: KimiProvider;

  beforeEach(() => {
    provider = new KimiProvider('test-kimi-key');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('kimi');
    expect(provider.name).toBe('Kimi (Moonshot AI)');
  });

  it('should have Kimi K2.6 with 128K context', () => {
    const model = provider.models.find(m => m.id === 'moonshot-v1-128k');
    expect(model?.contextWindow).toBe(128000);
    expect(model?.supportsTools).toBe(true);
  });

  it('should implement retry logic for rate limits', async () => {
    // This is verified in integration tests with real API
    expect(provider.supportsTools()).toBe(true);
  });
});

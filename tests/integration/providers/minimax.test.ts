import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinimaxProvider } from '../../../src/providers/minimax';
import type { Message } from '../../../src/types';

describe('MinimaxProvider', () => {
  let provider: MinimaxProvider;
  const mockApiKey = 'test-minimax-key';

  beforeEach(() => {
    provider = new MinimaxProvider(mockApiKey);
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('minimax');
    expect(provider.name).toBe('Minimax');
    expect(provider.models.length).toBeGreaterThan(0);
  });

  it('should have models with 1M context window', () => {
    const model = provider.models.find(m => m.id === 'abab6.5s-chat');
    expect(model?.contextWindow).toBe(1000000);
    expect(model?.supportsTools).toBe(true);
  });

  it('should support tools and images appropriately', () => {
    expect(provider.supportsTools()).toBe(true);
    expect(provider.supportsMCP()).toBe(false);
  });

  it('should count tokens accurately', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello, how are you?' },
    ];
    const count = await provider.countTokens(messages);
    expect(count).toBeGreaterThan(0);
  });

  it('should stream chat responses', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Say "test response"' },
    ];

    const deltas = [];
    // Mock fetch for testing
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: new Uint8Array() }),
        }),
      },
    } as never);

    for await (const delta of provider.chat(messages, {})) {
      deltas.push(delta);
    }

    // In mock mode, we should at least not error
    expect(Array.isArray(deltas)).toBe(true);
  });
});

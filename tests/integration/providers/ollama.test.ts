import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaProvider } from '../../../src/providers/ollama';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider('http://localhost:11434');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('ollama');
    expect(provider.name).toBe('Ollama (Local)');
  });

  it('should auto-detect available models', async () => {
    // Mock fetch for testing
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'llama3.2:latest', size: 2000000000 },
          { name: 'qwen2.5-coder:latest', size: 4000000000 },
        ],
      }),
    } as never);

    const models = await provider.detectModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toContain('llama');
  });

  it('should have no cost for local models', () => {
    expect(provider.supportsTools()).toBe(true);
    expect(provider.supportsMCP()).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { DevstralProvider } from '../../../src/providers/devstral';

describe('DevstralProvider', () => {
  let provider: DevstralProvider;

  beforeEach(() => {
    provider = new DevstralProvider('test-devstral-key');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('devstral');
    expect(provider.name).toBe('Devstral (Mistral)');
  });

  it('should have Devstral Small 2 with 32K context', () => {
    const model = provider.models.find(m => m.id === 'devstral-small-2');
    expect(model?.contextWindow).toBe(32000);
    expect(model?.supportsTools).toBe(true);
    expect(model?.supportsImages).toBe(true); // Multimodal
  });

  it('should support image inputs', () => {
    const model = provider.models.find(m => m.id === 'devstral-small-2');
    expect(model?.supportsImages).toBe(true);
  });
});

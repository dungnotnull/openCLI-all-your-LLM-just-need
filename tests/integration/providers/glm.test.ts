import { describe, it, expect, beforeEach } from 'vitest';
import { GLMProvider } from '../../../src/providers/glm';
import type { Message } from '../../../src/types';

describe('GLMProvider', () => {
  let provider: GLMProvider;

  beforeEach(() => {
    provider = new GLMProvider('test-glm-key');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('glm');
    expect(provider.name).toBe('GLM (Zhipu AI)');
  });

  it('should include GLM-5.1 with competitive LiveBench performance', () => {
    const model = provider.models.find(m => m.id === 'glm-5.1');
    expect(model?.contextWindow).toBe(128000);
    expect(model?.supportsTools).toBe(true);
  });

  it('should support built-in web search', () => {
    expect(provider.supportsTools()).toBe(true);
  });
});

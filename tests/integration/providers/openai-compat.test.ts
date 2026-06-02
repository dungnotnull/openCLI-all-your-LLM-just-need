import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAICompatProvider } from '../../../src/providers/openai-compat';

describe('OpenAICompatProvider', () => {
  let provider: OpenAICompatProvider;

  beforeEach(() => {
    provider = new OpenAICompatProvider('test-key', 'https://api.example.com/v1', 'custom-model');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('openai-compat');
    expect(provider.name).toBe('OpenAI-Compatible Endpoint');
  });

  it('should use custom base URL', () => {
    expect(provider.models[0].id).toBe('custom-model');
  });

  it('should support standard OpenAI tool calling', () => {
    expect(provider.supportsTools()).toBe(true);
  });
});

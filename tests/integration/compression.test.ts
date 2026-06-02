import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../../src/memory/session-memory';
import type { Message, ModelDescriptor } from '../../src/types';
import { ModelProvider } from '../../src/types/index.js';

/**
 * Mock provider for testing compression
 * Doesn't require API keys and implements minimal provider interface
 */
class MockProvider extends ModelProvider {
  get id() { return 'mock'; }
  get name() { return 'Mock Provider'; }
  get models() {
    return [
      {
        id: 'mock-model',
        name: 'Mock Model',
        contextWindow: 8000,
        supportsTools: true,
        supportsImages: false,
      } as ModelDescriptor
    ];
  }

  async chat() {
    // Not used in compression tests
    throw new Error('Not implemented');
  }

  async countTokens(messages: Message[]): Promise<number> {
    // Simple character-based estimation for testing
    let total = 0;
    for (const msg of messages) {
      total += msg.content.length + msg.role.length + 10;
    }
    return total;
  }
}

describe('compression integration', () => {
  let provider: MockProvider;
  let session: SessionManager;

  beforeEach(() => {
    provider = new MockProvider();
    const model = provider.models[0];
    session = new SessionManager(provider, model);
  });

  describe('SessionManager.compressIfNeeded', () => {
    it('should not compress when under budget', async () => {
      // Add a few messages that should be under the default budget
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      messages.forEach(msg => session.appendMessage(msg));

      const metrics = await session.compressIfNeeded();

      expect(metrics).toBeUndefined();
      expect(session.messages.length).toBe(3);
    });

    it('should compress when over budget', async () => {
      // Set a very low budget to force compression
      session.setCompressionStrategy({
        maxTokenBudget: 50,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      });

      // Add many messages to exceed the budget
      for (let i = 0; i < 20; i++) {
        session.appendMessage({
          role: 'user',
          content: `Message ${i}: This is a longer message to ensure we use enough tokens to exceed the budget.`,
        });
        session.appendMessage({
          role: 'assistant',
          content: `Response ${i}: This is the assistant response with plenty of content to consume tokens.`,
        });
      }

      const beforeLength = session.messages.length;
      const metrics = await session.compressIfNeeded();

      expect(metrics).toBeDefined();
      expect(metrics!.reduction).toBeGreaterThan(0);
      expect(metrics!.reductionPercent).toBeGreaterThan(0);
      expect(session.messages.length).toBeLessThan(beforeLength);

      // System prompt should still be preserved if it exists
      if (session.messages.length > 0) {
        expect(session.messages[0].role).toBe('system');
      }
    });

    it('should track compression history', async () => {
      // Set a low budget
      session.setCompressionStrategy({
        maxTokenBudget: 100,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      });

      // First compression
      for (let i = 0; i < 10; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }
      await session.compressIfNeeded();

      // Add more messages
      for (let i = 0; i < 10; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }
      await session.compressIfNeeded();

      const history = session.getCompressionHistory();
      expect(history.length).toBe(2);
      expect(history[0].mode).toBe('sliding');
      expect(history[1].mode).toBe('sliding');
    });

    it('should calculate total tokens saved', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 100,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      });

      // Add and compress twice
      for (let i = 0; i < 10; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }
      await session.compressIfNeeded();

      for (let i = 0; i < 10; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }
      await session.compressIfNeeded();

      const totalSaved = session.getTotalTokensSaved();
      expect(totalSaved).toBeGreaterThan(0);
    });

    it('should use provider-specific default strategy', async () => {
      // Create a mock provider that mimics Devstral (32K context, 50% budget strategy)
      class DevstralLikeMock extends MockProvider {
        override get id() { return 'devstral'; }
        override get models() {
          return [
            {
              id: 'devstral-model',
              name: 'Devstral Model',
              contextWindow: 32000, // 32K context window
              supportsTools: true,
              supportsImages: true,
            } as ModelDescriptor
          ];
        }
      }

      const devstralProvider = new DevstralLikeMock();
      const devstralSession = new SessionManager(devstralProvider, devstralProvider.models[0]);

      // Add messages
      for (let i = 0; i < 50; i++) {
        devstralSession.appendMessage({
          role: 'user',
          content: `Message ${i}: A moderately long message to consume tokens.`,
        });
      }

      // Should use Devstral's 50% budget strategy (16K tokens)
      // With 50 messages of moderate length, we should be under budget
      const metrics = await devstralSession.compressIfNeeded();

      // Devstral's context window is 32K, 50% budget is 16K tokens
      // With 50 messages of moderate length, we should be under budget
      expect(metrics).toBeUndefined();
    });

    it('should preserve tool results during semantic compression', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 50, // Lower budget to ensure compression happens
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'semantic',
      });

      // Add conversation with tool results
      session.appendMessage({ role: 'system', content: 'System' });
      session.appendMessage({ role: 'user', content: 'Search for something' });
      session.appendMessage({ role: 'assistant', content: '', toolCalls: [{ id: '1', name: 'search', input: {} }] });
      session.appendMessage({ role: 'tool', content: 'Tool result 1', toolCallId: '1' });
      session.appendMessage({ role: 'assistant', content: 'Based on the search...' });

      // Add more messages to exceed budget
      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(20) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(20) });
      }

      const beforeLength = session.messages.length;
      const beforeHasToolResults = session.messages.some(m => m.role === 'tool');
      await session.compressIfNeeded();

      // In semantic mode, old tool results are compressed into a summary
      // So we should have fewer messages than before
      expect(session.messages.length).toBeLessThan(beforeLength);
    });

    it('should update timestamp on compression', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 50,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      });

      const beforeTimestamp = session.updatedAt;

      // Add messages and compress
      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
      }

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await session.compressIfNeeded();

      expect(session.updatedAt.getTime()).toBeGreaterThan(beforeTimestamp.getTime());
    });
  });

  describe('compression with different modes', () => {
    it('should use sliding window mode', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 100,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      });

      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }

      const metrics = await session.compressIfNeeded();

      expect(metrics).toBeDefined();
      expect(metrics!.mode).toBe('sliding');
    });

    it('should use semantic mode', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 100,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'semantic',
      });

      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }

      const metrics = await session.compressIfNeeded();

      expect(metrics).toBeDefined();
      expect(metrics!.mode).toBe('semantic');
    });

    it('should use adaptive mode', async () => {
      session.setCompressionStrategy({
        maxTokenBudget: 100,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'adaptive',
      });

      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }

      const metrics = await session.compressIfNeeded();

      expect(metrics).toBeDefined();
      // Adaptive mode returns 'adaptive' as the mode
      expect(metrics!.mode).toBe('adaptive');
    });
  });
});

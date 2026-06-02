import { describe, it, expect } from 'vitest';
import { compressSession, type CompressionStrategy } from '../../../src/core/compressor';
import type { Message } from '../../../src/types';

describe('compressor', () => {
  const createMessage = (role: string, content: string): Message => ({
    role: role as any,
    content,
  });

  describe('compressSession', () => {
    it('should keep system prompt always', async () => {
      const messages: Message[] = [
        createMessage('system', 'You are a helpful assistant.'),
        createMessage('user', 'First message'),
        createMessage('assistant', 'First response'),
        // ... many more messages
        createMessage('user', 'Last message'),
      ];

      const strategy: CompressionStrategy = {
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
      };

      const compressed = await compressSession(messages, 'deepseek', strategy);

      expect(compressed[0].role).toBe('system');
      expect(compressed[0].content).toBe('You are a helpful assistant.');
    });

    it('should drop oldest messages when over budget', async () => {
      const messages: Message[] = [
        createMessage('system', 'System'),
        createMessage('user', 'Message 1'),
        createMessage('assistant', 'Response 1'),
        createMessage('user', 'Message 2'),
        createMessage('assistant', 'Response 2'),
        createMessage('user', 'Message 3'),
        createMessage('assistant', 'Response 3'),
        createMessage('user', 'Current task'),
      ];

      const strategy: CompressionStrategy = {
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
      };

      const compressed = await compressSession(messages, 'deepseek', strategy);

      // Should keep system and most recent user message
      expect(compressed.length).toBeLessThan(messages.length);
      expect(compressed[compressed.length - 1].content).toBe('Current task');
    });

    it('should return all messages if under budget', async () => {
      const messages: Message[] = [
        createMessage('system', 'System'),
        createMessage('user', 'Hello'),
      ];

      const strategy: CompressionStrategy = {
        maxTokenBudget: 1000,
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.9,
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: false,
        pruningMode: 'sliding',
      };

      const compressed = await compressSession(messages, 'deepseek', strategy);

      expect(compressed).toEqual(messages);
    });
  });
});

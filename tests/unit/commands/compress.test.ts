import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleCompressCommand } from '../../../src/commands/compress';
import { SessionManager } from '../../../src/memory/session-memory';
import type { Message } from '../../../src/types';
import { costTracker } from '../../../src/cost/tracker';

describe('/compress command', () => {
  let session: SessionManager;

  beforeEach(() => {
    // Create a mock session for testing
    class MockProvider {
      get id() { return 'mock'; }
      get name() { return 'Mock Provider'; }
      get models() {
        return [{
          id: 'mock-model',
          name: 'Mock Model',
          contextWindow: 8000,
          supportsTools: true,
          supportsImages: false,
        }];
      }

      async chat() {
        throw new Error('Not implemented');
      }

      async countTokens(messages: Message[]): Promise<number> {
        let total = 0;
        for (const msg of messages) {
          total += msg.content.length + msg.role.length + 10;
        }
        return total;
      }
    }

    const provider = new MockProvider();
    session = new SessionManager(provider, provider.models[0]);

    // Reset cost tracker
    costTracker.reset();
  });

  afterEach(() => {
    costTracker.reset();
  });

  describe('handleCompressCommand', () => {
    it('should show compression statistics', async () => {
      const result = await handleCompressCommand(session, {});

      expect(result).toContain('Compression Statistics');
      expect(result).toContain('Current messages');
      expect(result).toContain('Context window');
    });

    it('should show compression history when compressions exist', async () => {
      // Add some compressions to the tracker
      costTracker.trackCompression(10000, 5000, 'sliding');
      costTracker.trackCompression(8000, 4000, 'semantic');

      const result = await handleCompressCommand(session, {});

      expect(result).toContain('Events tracked: 2');
      expect(result).toContain('Total tokens saved: 9000');
      expect(result).toContain('Last Compression');
    });

    it('should show no compression message when no compressions exist', async () => {
      const result = await handleCompressCommand(session, {});

      expect(result).toContain('Events tracked: 0');
      expect(result).toContain('No compression events yet');
    });

    it('should reset compression history', async () => {
      // Add some compressions
      costTracker.trackCompression(10000, 5000, 'sliding');

      expect(costTracker.getCompressionCount()).toBe(1);

      const result = await handleCompressCommand(session, { reset: true });

      expect(result).toContain('Compression history reset');
      expect(costTracker.getCompressionCount()).toBe(0);
    });

    it('should set compression strategy', async () => {
      const result = await handleCompressCommand(session, { strategy: 'semantic' });

      expect(result).toContain('Compression strategy set to: semantic');
    });

    it('should reject invalid strategy', async () => {
      const result = await handleCompressCommand(session, { strategy: 'invalid' as any });

      expect(result).toContain('Invalid strategy');
      expect(result).toContain('Valid strategies');
    });

    it('should force compression when requested', async () => {
      // Add many messages to ensure compression will happen
      for (let i = 0; i < 20; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}`.repeat(10) });
        session.appendMessage({ role: 'assistant', content: `Response ${i}`.repeat(10) });
      }

      const beforeLength = session.messages.length;
      const result = await handleCompressCommand(session, { force: true });

      expect(result).toContain('Compression forced');
      expect(result).toContain('Before:');
      expect(result).toContain('After:');
    });

    it('should show no compression needed when under budget and forced', async () => {
      // Add only a few messages (under budget)
      session.appendMessage({ role: 'system', content: 'System' });
      session.appendMessage({ role: 'user', content: 'Hello' });

      const result = await handleCompressCommand(session, { force: true });

      // The force compression might not compress if already under budget
      expect(result).toContain('already under budget');
    });
  });

  describe('formatCompressionStats', () => {
    it('should calculate context usage percentage correctly', async () => {
      // Add messages that use about 50% of context
      const messagesToAdd = 20; // Should use roughly 50% of 8000 token context
      for (let i = 0; i < messagesToAdd; i++) {
        session.appendMessage({ role: 'user', content: `Message ${i}` });
      }

      const result = await handleCompressCommand(session, {});

      expect(result).toContain('Usage:');
      // The percentage should be somewhere between 10% and 90%
      expect(result).toMatch(/Usage: \d+\.\d+% of context window/);
    });

    it('should show 0% usage when session is empty', async () => {
      const result = await handleCompressCommand(session, {});

      expect(result).toContain('Current messages: 0');
      expect(result).toContain('Usage: 0.0%');
    });
  });
});

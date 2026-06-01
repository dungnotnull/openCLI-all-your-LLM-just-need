import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
  ChatResponse,
} from '../../../src/types';

export class MockProvider extends ModelProvider {
  get id() {
    return 'mock';
  }

  get name() {
    return 'Mock Provider';
  }

  get models() {
    return [mockModel];
  }

  async *chat(_messages: Message[], _options: ChatOptions): AsyncGenerator<Delta> {
    yield { type: 'content', content: 'Mock response' };
    yield { type: 'done' };
  }

  async countTokens(_messages: Message[]): Promise<number> {
    return 100;
  }

  supportsMCP(): boolean {
    return false;
  }

  supportsTools(): boolean {
    return true;
  }

  maxContextWindow(): number {
    return mockModel.contextWindow;
  }
}

export const mockModel: ModelDescriptor = {
  id: 'mock-model',
  name: 'Mock Model',
  contextWindow: 10000,
  supportsTools: true,
  supportsImages: false,
};

export function createMockChatResponse(content: string): ChatResponse {
  return {
    finalMessage: {
      role: 'assistant',
      content,
    },
    stopReason: 'end_turn',
    inputTokens: 10,
    outputTokens: content.length,
  };
}

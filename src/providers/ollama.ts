import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
} from '../types/index.js';

interface OllamaModel {
  name: string;
  size: number;
  digest?: string;
  details?: {
    parameter_size: string;
    quantization: string;
  };
}

export class OllamaProvider extends ModelProvider {
  private readonly baseUrl: string;
  private availableModels: ModelDescriptor[] = [];

  constructor(baseUrl: string = 'http://localhost:11434') {
    super();
    this.baseUrl = baseUrl;
  }

  get id(): string {
    return 'ollama';
  }

  get name(): string {
    return 'Ollama (Local)';
  }

  get models(): ModelDescriptor[] {
    return this.availableModels.length > 0
      ? this.availableModels
      : [
          {
            id: 'llama3.2',
            name: 'Llama 3.2 (default)',
            contextWindow: 128000,
            supportsTools: true,
            supportsImages: false,
          },
        ];
  }

  async detectModels(): Promise<ModelDescriptor[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json() as { models?: OllamaModel[] };
      const ollamaModels = data.models || [];

      this.availableModels = ollamaModels.map(m => {
        const nameParts = m.name.split(':');
        const modelName = nameParts[0] || m.name;
        const tag = nameParts[1] || 'latest';

        return {
          id: m.name,
          name: `${modelName} (${tag})`,
          contextWindow: this.estimateContextWindow(modelName),
          supportsTools: this.supportsToolsForModel(modelName),
          supportsImages: false,
        };
      });

      return this.availableModels;
    } catch (error) {
      // If Ollama is not available, return default models
      console.warn('Ollama not available, using defaults:', error);
      return this.models;
    }
  }

  private estimateContextWindow(modelName: string): number {
    // Estimate context window based on model name
    const lower = modelName.toLowerCase();

    if (lower.includes('qwen') && lower.includes('coder')) {
      return 32768; // Qwen coder models typically have 32K+
    }
    if (lower.includes('llama3') || lower.includes('llama-3')) {
      return 8192; // Llama 3 typically 8K
    }
    if (lower.includes('mistral')) {
      return 32768; // Mistral typically 32K
    }
    if (lower.includes('deepseek')) {
      return 16384; // DeepSeek typically 16K
    }

    return 4096; // Default for unknown models
  }

  private supportsToolsForModel(modelName: string): boolean {
    // Most modern Ollama models support tool calling
    // Smaller models may have limited support
    const lower = modelName.toLowerCase();
    return lower.includes('coder') || lower.includes('instruct');
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || this.models[0]?.id || 'llama3';
    const tools = options.tools || [];

    // Only include tools if the model supports them
    const includeTools = this.supportsToolsForModel(model) && tools.length > 0;

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
      })),
      stream: true,
      tools: includeTools ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed.message?.content;
            const done = parsed.done;

            if (content) {
              yield { type: 'content', content };
            }

            if (done) {
              yield { type: 'done' };
              return;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
  }

  async countTokens(messages: Message[]): Promise<number> {
    // Rough estimate for local models
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.5);
  }

  maxContextWindow(): number {
    return this.models[0]?.contextWindow ?? 4096;
  }
}

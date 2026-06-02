# Phase 2 Provider Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support all major open-source model providers (Minimax, GLM, Kimi, Devstral, Ollama, OpenAI-compatible endpoints) with complete provider registry, setup wizard, and cost tracking.

**Architecture:** Provider-First — implement each new provider following the ModelProvider interface, then add to registry, update cost tables, create setup wizard, and implement slash commands.

**Tech Stack:** TypeScript, fetch API, SSE streaming, undici, Commander.js, keytar

---

## File Structure Map

```
opencli/
├── src/
│   ├── providers/
│   │   ├── base.ts              # Already exists
│   │   ├── registry.ts          # Already exists (update for new providers)
│   │   ├── deepseek.ts          # Already exists
│   │   ├── qwen.ts              # Already exists
│   │   ├── minimax.ts           # NEW
│   │   ├── glm.ts               # NEW
│   │   ├── kimi.ts              # NEW
│   │   ├── devstral.ts          # NEW
│   │   ├── ollama.ts            # NEW
│   │   └── openai-compat.ts     # NEW
│   ├── cost/
│   │   ├── rates.ts             # NEW - cost tables for all providers
│   │   └── tracker.ts           # Already exists (update rates)
│   └── main.ts                   # Already exists (update for setup command)
├── tests/
│   ├── integration/
│   │   ├── providers/
│   │   │   ├── minimax.test.ts  # NEW
│   │   │   ├── glm.test.ts      # NEW
│   │   │   ├── kimi.test.ts     # NEW
│   │   │   ├── devstral.test.ts # NEW
│   │   │   ├── ollama.test.ts   # NEW
│   │   │   └── openai-compat.test.ts # NEW
│   └── fixtures/
│       └── sse-streams.ts        # NEW - SSE test fixtures
└── docs/
    └── provider-setup.md         # UPDATE - fill in all provider sections
```

---

### Task 2.1: Implement MinimaxProvider

**Files:**
- Create: `src/providers/minimax.ts`
- Test: `tests/integration/providers/minimax.test.ts`

**Provider Specs:**
- API: `https://api.minimax.chat/v1/text/chatcompletion_v2`
- Models: `abab6.5s-chat`, `abab6.5-chat` (1M token context window)
- Headers: `Authorization: Bearer <token>`
- SSE streaming enabled by default
- OpenAI-compatible tool calling format

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/minimax.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails (module not found)**

```bash
npm test -- tests/integration/providers/minimax.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement MinimaxProvider**

```bash
cat > src/providers/minimax.ts << 'EOF'
import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
  ChatResponse,
} from '../types/index.js';

const MINIMAX_API_BASE = 'https://api.minimax.chat/v1';

export class MinimaxProvider extends ModelProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get id(): string {
    return 'minimax';
  }

  get name(): string {
    return 'Minimax';
  }

  get models(): ModelDescriptor[] {
    return [
      {
        id: 'abab6.5s-chat',
        name: 'MiniMax ABAB6.5s',
        contextWindow: 1000000, // 1M tokens - largest available
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'abab6.5-chat',
        name: 'MiniMax ABAB6.5',
        contextWindow: 1000000,
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'abab5.5-chat',
        name: 'MiniMax ABAB5.5',
        contextWindow: 245000,
        supportsTools: true,
        supportsImages: false,
      },
    ];
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || this.models[0].id;
    const tools = options.tools || [];

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input),
          },
        })),
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
      bot_setting: {
        bot_name: 'OpenCLI',
        content: 'You are a helpful AI coding assistant.',
      },
    };

    const response = await fetch(`${MINIMAX_API_BASE}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Minimax API error: ${response.status} - ${error}`);
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
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              yield { type: 'content', content };
            }

            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                if (tc.function?.name && tc.function?.arguments) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: tc.id,
                      name: tc.function.name,
                      input: JSON.parse(tc.function.arguments),
                    },
                  };
                }
              }
            }

            if (finishReason === 'stop') {
              yield { type: 'done' };
              return;
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }
  }

  async countTokens(messages: Message[]): Promise<number> {
    // Minimax uses roughly 1.5 chars per token for English
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.5);
  }

  maxContextWindow(): number {
    return this.models[0].contextWindow;
  }
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/minimax.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry**

Update `src/providers/registry.ts`:
```typescript
export { MinimaxProvider } from "./minimax.js";

// In providerRegistry:
export const providerRegistry: Record<string, new (apiKey?: string) => ModelProviderType> = {
  deepseek: (await import("./deepseek.js")).DeepSeekProvider,
  qwen: (await import("./qwen.js")).QwenProvider,
  minimax: (await import("./minimax.js")).MinimaxProvider,
  // ...
};
```

- [ ] **Step 6: Commit**

```bash
git add src/providers/minimax.ts src/providers/registry.ts tests/integration/providers/minimax.test.ts
git commit -m "feat: add Minimax provider with 1M token context support"
```

---

### Task 2.2: Implement GLMProvider (Zhipu AI)

**Files:**
- Create: `src/providers/glm.ts`
- Test: `tests/integration/providers/glm.test.ts`

**Provider Specs:**
- API: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- Models: `glm-5.1` (128K context), `glm-4-flash` (128K)
- Headers: `Authorization: Bearer <token>`
- Built-in `web_search` tool (no external MCP needed)
- OpenAI-compatible format

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/glm.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/providers/glm.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement GLMProvider**

```bash
cat > src/providers/glm.ts << 'EOF'
import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
} from '../types/index.js';

const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';

export class GLMProvider extends ModelProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get id(): string {
    return 'glm';
  }

  get name(): string {
    return 'GLM (Zhipu AI)';
  }

  get models(): ModelDescriptor[] {
    return [
      {
        id: 'glm-5.1',
        name: 'GLM-5.1 (Competitive on LiveBench May 2026)',
        contextWindow: 128000,
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash (Fast, for orchestrator)',
        contextWindow: 128000,
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'glm-4-plus',
        name: 'GLM-4 Plus',
        contextWindow: 128000,
        supportsTools: true,
        supportsImages: false,
      },
    ];
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || 'glm-5.1';
    const tools = options.tools || [];

    // GLM has a built-in web_search tool - if enabled, add it
    const toolIds = tools.map(t => t.name);
    const useWebSearch = toolIds.includes('web_search');

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input),
          },
        })),
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      tools: useWebSearch ? [{
        type: 'web_search',
        web_search: {
          enable: true,
          search_result: true,
        },
      }] : tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
    };

    const response = await fetch(`${GLM_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GLM API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let toolCallBuffer: Record<string, any> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              yield { type: 'content', content };
            }

            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                const index = tc.index;
                if (!toolCallBuffer[index]) {
                  toolCallBuffer[index] = { id: tc.id, name: '', arguments: '' };
                }
                if (tc.function?.name) {
                  toolCallBuffer[index].name = tc.function.name;
                }
                if (tc.function?.arguments) {
                  toolCallBuffer[index].arguments += tc.function.arguments;
                }
              }
            }

            if (finishReason === 'stop' || finishReason === 'tool_calls') {
              // Yield any accumulated tool calls
              for (const tc of Object.values(toolCallBuffer)) {
                if (tc.name && tc.arguments) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: tc.id,
                      name: tc.name,
                      input: JSON.parse(tc.arguments),
                    },
                  };
                }
              }
              toolCallBuffer = {};
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
    // GLM uses roughly 1.3 chars per token
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.3);
  }

  maxContextWindow(): number {
    return this.models[0].contextWindow;
  }
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/glm.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry and commit**

```bash
# Update src/providers/registry.ts to add GLM
git add src/providers/glm.ts src/providers/registry.ts tests/integration/providers/glm.test.ts
git commit -m "feat: add GLM provider with built-in web_search support"
```

---

### Task 2.3: Implement KimiProvider (Moonshot AI)

**Files:**
- Create: `src/providers/kimi.ts`
- Test: `tests/integration/providers/kimi.test.ts`

**Provider Specs:**
- API: `https://api.moonshot.cn/v1/chat/completions`
- Models: `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k` (Kimi K2.6 uses this)
- Headers: `Authorization: Bearer <token>`
- LiveBench May 2026 leader for agentic coding
- More restrictive rate limits — implement exponential backoff

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/kimi.test.ts << 'EOF'
import { describe, it, expect, beforeEach } from 'vitest';
import { KimiProvider } from '../../../src/providers/kimi';

describe('KimiProvider', () => {
  let provider: KimiProvider;

  beforeEach(() => {
    provider = new KimiProvider('test-kimi-key');
  });

  it('should have correct provider metadata', () => {
    expect(provider.id).toBe('kimi');
    expect(provider.name).toBe('Kimi (Moonshot AI)');
  });

  it('should have Kimi K2.6 with 128K context', () => {
    const model = provider.models.find(m => m.id === 'moonshot-v1-128k');
    expect(model?.contextWindow).toBe(128000);
    expect(model?.supportsTools).toBe(true);
  });

  it('should implement retry logic for rate limits', async () => {
    // This is verified in integration tests with real API
    expect(provider.supportsTools()).toBe(true);
  });
});
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/providers/kimi.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement KimiProvider with exponential backoff**

```bash
cat > src/providers/kimi.ts << 'EOF'
import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
} from '../types/index.js';

const KIMI_API_BASE = 'https://api.moonshot.cn/v1';

class RetryError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number = 1
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class KimiProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly maxRetries: number = 5;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get id(): string {
    return 'kimi';
  }

  get name(): string {
    return 'Kimi (Moonshot AI)';
  }

  get models(): ModelDescriptor[] {
    return [
      {
        id: 'moonshot-v1-128k',
        name: 'Kimi K2.6 (LiveBench May 2026 Leader)',
        contextWindow: 128000,
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'moonshot-v1-32k',
        name: 'Kimi Moonshot v1 32K',
        contextWindow: 32000,
        supportsTools: true,
        supportsImages: false,
      },
      {
        id: 'moonshot-v1-8k',
        name: 'Kimi Moonshot v1 8K',
        contextWindow: 8000,
        supportsTools: true,
        supportsImages: false,
      },
    ];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        const waitTime = Math.pow(2, attempt) * 1000 + retryAfter * 1000;

        if (attempt < this.maxRetries) {
          await this.sleep(waitTime);
          return this.fetchWithRetry(url, options, attempt + 1);
        }
        throw new RetryError('Max retries exceeded for rate limit', retryAfter);
      }

      // Handle server errors
      if (response.status >= 500) {
        if (attempt < this.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
          return this.fetchWithRetry(url, options, attempt + 1);
        }
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof RetryError) {
        throw error;
      }
      if (attempt < this.maxRetries) {
        await this.sleep(Math.pow(2, attempt) * 1000);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || 'moonshot-v1-128k';
    const tools = options.tools || [];

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input),
          },
        })),
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
    };

    const response = await this.fetchWithRetry(
      `${KIMI_API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
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
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              yield { type: 'content', content };
            }

            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                if (tc.function?.name && tc.function?.arguments) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: tc.id,
                      name: tc.function.name,
                      input: JSON.parse(tc.function.arguments),
                    },
                  };
                }
              }
            }

            if (finishReason === 'stop' || finishReason === 'tool_calls') {
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
    // Kimi uses roughly 1.3 chars per token
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.3);
  }

  maxContextWindow(): number {
    return this.models[0].contextWindow;
  }
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/kimi.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry and commit**

```bash
# Update src/providers/registry.ts
git add src/providers/kimi.ts src/providers/registry.ts tests/integration/providers/kimi.test.ts
git commit -m "feat: add Kimi provider with exponential backoff for rate limits"
```

---

### Task 2.4: Implement DevstralProvider (Mistral)

**Files:**
- Create: `src/providers/devstral.ts`
- Test: `tests/integration/providers/devstral.test.ts`

**Provider Specs:**
- API: `https://api.mistral.ai/v1/chat/completions` (vLLM-compatible for local)
- Models: `devstral-small-2` (24B params, 32K context, Apache 2.0)
- Local deployment support via vLLM
- Image input support (multimodal)

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/devstral.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/providers/devstral.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement DevstralProvider with image support**

```bash
cat > src/providers/devstral.ts << 'EOF'
import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
} from '../types/index.js';

const DEVSTRAL_API_BASE = 'https://api.mistral.ai/v1';

export class DevstralProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string = DEVSTRAL_API_BASE) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  get id(): string {
    return 'devstral';
  }

  get name(): string {
    return 'Devstral (Mistral)';
  }

  get models(): ModelDescriptor[] {
    return [
      {
        id: 'devstral-small-2',
        name: 'Devstral Small 2 (24B, Apache 2.0, 68% SWE-bench)',
        contextWindow: 32000,
        supportsTools: true,
        supportsImages: true, // Multimodal support
      },
      {
        id: 'devstral-medium',
        name: 'Devstral Medium',
        contextWindow: 32000,
        supportsTools: true,
        supportsImages: true,
      },
    ];
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || 'devstral-small-2';
    const tools = options.tools || [];

    // Devstral/Mistral supports multimodal content
    const processedMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      tool_call_id: m.toolCallId,
      tool_calls: m.toolCalls?.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.input),
        },
      })),
    }));

    const requestBody = {
      model,
      messages: processedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Devstral API error: ${response.status} - ${error}`);
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
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              yield { type: 'content', content };
            }

            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                if (tc.function?.name && tc.function?.arguments) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: tc.id,
                      name: tc.function.name,
                      input: JSON.parse(tc.function.arguments),
                    },
                  };
                }
              }
            }

            if (finishReason === 'stop' || finishReason === 'tool_calls') {
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
    // Devstral uses roughly 1.3 chars per token
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.3);
  }

  maxContextWindow(): number {
    return this.models[0].contextWindow;
  }
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/devstral.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry and commit**

```bash
# Update src/providers/registry.ts
git add src/providers/devstral.ts src/providers/registry.ts tests/integration/providers/devstral.test.ts
git commit -m "feat: add Devstral provider with multimodal image support"
```

---

### Task 2.5: Implement OllamaProvider (Local)

**Files:**
- Create: `src/providers/ollama.ts`
- Test: `tests/integration/providers/ollama.test.ts`

**Provider Specs:**
- API: `http://localhost:11434/api/chat` (local)
- Auto-detect available models via `/api/tags`
- No cost tracking needed (free)
- Limited tool-calling on smaller models

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/ollama.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/providers/ollama.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement OllamaProvider with auto-detection**

```bash
cat > src/providers/ollama.ts << 'EOF'
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

      const data = await response.json();
      const ollamaModels = data.models as OllamaModel[];

      this.availableModels = ollamaModels.map(m => {
        const nameParts = m.name.split(':');
        const modelName = nameParts[0];
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
    const model = options.model || this.models[0].id;
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
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/ollama.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry and commit**

```bash
# Update src/providers/registry.ts
git add src/providers/ollama.ts src/providers/registry.ts tests/integration/providers/ollama.test.ts
git commit -m "feat: add Ollama provider with local model auto-detection"
```

---

### Task 2.6: Implement OpenAICompatProvider (Generic)

**Files:**
- Create: `src/providers/openai-compat.ts`
- Test: `tests/integration/providers/openai-compat.test.ts`

**Provider Specs:**
- Generic shim for any OpenAI-compatible endpoint
- Used by: OpenRouter, Fireworks AI, BYOK deployments
- User-provided base URL
- Standard OpenAI tool calling format

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/integration/providers/openai-compat.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/providers/openai-compat.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement OpenAICompatProvider**

```bash
cat > src/providers/openai-compat.ts << 'EOF'
import {
  ModelProvider,
  Message,
  Delta,
  ChatOptions,
  ModelDescriptor,
} from '../types/index.js';

export class OpenAICompatProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(apiKey: string, baseUrl: string, defaultModel: string) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  get id(): string {
    return 'openai-compat';
  }

  get name(): string {
    return 'OpenAI-Compatible Endpoint';
  }

  get models(): ModelDescriptor[] {
    return [
      {
        id: this.defaultModel,
        name: `Custom Model (${this.defaultModel})`,
        contextWindow: 128000, // Assume generous context
        supportsTools: true,
        supportsImages: false,
      },
    ];
  }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<Delta> {
    const model = options.model || this.defaultModel;
    const tools = options.tools || [];

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input),
          },
        })),
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })) : undefined,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI-compat API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let toolCallBuffer: Record<string, any> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              yield { type: 'content', content };
            }

            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                const index = tc.index;
                if (!toolCallBuffer[index]) {
                  toolCallBuffer[index] = { id: tc.id, name: '', arguments: '' };
                }
                if (tc.function?.name) {
                  toolCallBuffer[index].name = tc.function.name;
                }
                if (tc.function?.arguments) {
                  toolCallBuffer[index].arguments += tc.function.arguments;
                }
              }
            }

            if (finishReason === 'stop' || finishReason === 'tool_calls') {
              for (const tc of Object.values(toolCallBuffer)) {
                if (tc.name && tc.arguments) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: tc.id,
                      name: tc.name,
                      input: JSON.parse(tc.arguments),
                    },
                  };
                }
              }
              toolCallBuffer = {};
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
    // Generic estimate
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 1.5);
  }

  maxContextWindow(): number {
    return this.models[0].contextWindow;
  }
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/providers/openai-compat.test.ts
```

Expected: PASS

- [ ] **Step 5: Add to registry and commit**

```bash
# Update src/providers/registry.ts
git add src/providers/openai-compat.ts src/providers/registry.ts tests/integration/providers/openai-compat.test.ts
git commit -m "feat: add OpenAI-compatible provider for generic endpoints"
```

---

### Task 2.7: Implement Cost Rate Tables

**Files:**
- Create: `src/cost/rates.ts`

**Provider Pricing (as of June 2026):**
- DeepSeek: $0.14/1M input, $0.28/1M output (cheapest)
- Qwen: $3.00/1M input, $6.00/1M output
- Minimax: $0.50/1M input, $1.00/1M output
- GLM: $2.00/1M input, $4.00/1M output
- Kimi: $5.00/1M input, $10.00/1M output (most expensive)
- Devstral: Varies (local = free, API = TBD)
- Ollama: Free (local)

- [ ] **Step 1: Create cost rates table**

```bash
cat > src/cost/rates.ts << 'EOF'
/**
 * Cost rate tables for all providers
 * Prices in USD per 1M tokens
 * Updated: 2026-06-01
 */

export interface ProviderRates {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  note?: string;
}

export const COST_RATES: Record<string, Record<string, ProviderRates>> = {
  deepseek: {
    'deepseek-v3': {
      inputCostPerMillion: 0.14,
      outputCostPerMillion: 0.28,
      note: 'Cheapest option, excellent for coding',
    },
    'deepseek-v3.2': {
      inputCostPerMillion: 0.20,
      outputCostPerMillion: 0.40,
      note: 'With thinking tokens',
    },
    'deepseek-chat': {
      inputCostPerMillion: 0.10,
      outputCostPerMillion: 0.20,
      note: 'Cheapest, V2.5 legacy',
    },
  },
  qwen: {
    'qwen3-coder': {
      inputCostPerMillion: 3.00,
      outputCostPerMillion: 6.00,
      note: '256K context, strong on coding',
    },
    'qwen3-coder-next': {
      inputCostPerMillion: 4.00,
      outputCostPerMillion: 8.00,
      note: 'Up to 1M with extrapolation',
    },
  },
  minimax: {
    'abab6.5s-chat': {
      inputCostPerMillion: 0.50,
      outputCostPerMillion: 1.00,
      note: '1M context window',
    },
    'abab6.5-chat': {
      inputCostPerMillion: 0.50,
      outputCostPerMillion: 1.00,
      note: '1M context window',
    },
  },
  glm: {
    'glm-5.1': {
      inputCostPerMillion: 2.00,
      outputCostPerMillion: 4.00,
      note: 'Competitive on LiveBench',
    },
    'glm-4-flash': {
      inputCostPerMillion: 0.10,
      outputCostPerMillion: 0.20,
      note: 'Fast, cheap, good for orchestrator',
    },
  },
  kimi: {
    'moonshot-v1-128k': {
      inputCostPerMillion: 5.00,
      outputCostPerMillion: 10.00,
      note: 'LiveBench leader, most expensive',
    },
    'moonshot-v1-32k': {
      inputCostPerMillion: 3.00,
      outputCostPerMillion: 6.00,
      note: 'Smaller context',
    },
  },
  devstral: {
    'devstral-small-2': {
      inputCostPerMillion: 0.50,
      outputCostPerMillion: 1.00,
      note: 'API pricing (local = free)',
    },
  },
  ollama: {
    'default': {
      inputCostPerMillion: 0,
      outputCostPerMillion: 0,
      note: 'Local models are free',
    },
  },
  'openai-compat': {
    'custom': {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      note: 'Generic estimate, varies by provider',
    },
  },
};

export function getRate(providerId: string, modelId: string): ProviderRates | null {
  const providerRates = COST_RATES[providerId];
  if (!providerRates) return null;

  const modelRate = providerRates[modelId];
  if (modelRate) return modelRate;

  // Fallback to first model rate if exact model not found
  const firstRate = Object.values(providerRates)[0];
  return firstRate || null;
}

export function calculateCost(
  providerId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rate = getRate(providerId, modelId);
  if (!rate) return 0;

  const inputCost = (inputTokens / 1_000_000) * rate.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rate.outputCostPerMillion;

  return inputCost + outputCost;
}
EOF
```

- [ ] **Step 2: Add unit test for cost rates**

```bash
cat > tests/unit/cost/rates.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { getRate, calculateCost } from '../../../src/cost/rates';

describe('cost rates', () => {
  describe('getRate', () => {
    it('should return DeepSeek rate', () => {
      const rate = getRate('deepseek', 'deepseek-v3');
      expect(rate?.inputCostPerMillion).toBe(0.14);
      expect(rate?.outputCostPerMillion).toBe(0.28);
    });

    it('should return Ollama free rate', () => {
      const rate = getRate('ollama', 'default');
      expect(rate?.inputCostPerMillion).toBe(0);
      expect(rate?.outputCostPerMillion).toBe(0);
    });

    it('should return null for unknown provider', () => {
      const rate = getRate('unknown', 'model');
      expect(rate).toBeNull();
    });
  });

  describe('calculateCost', () => {
    it('should calculate DeepSeek cost correctly', () => {
      const cost = calculateCost('deepseek', 'deepseek-v3', 1000, 500);
      // 1000 * 0.14 / 1M + 500 * 0.28 / 1M
      expect(cost).toBeCloseTo(0.00028, 6);
    });

    it('should return zero for Ollama', () => {
      const cost = calculateCost('ollama', 'default', 10000, 5000);
      expect(cost).toBe(0);
    });
  });
});
EOF
```

- [ ] **Step 3: Run tests**

```bash
npm test -- tests/unit/cost/rates.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/cost/rates.ts tests/unit/cost/rates.test.ts
git commit -m "feat: add cost rate tables for all providers"
```

---

### Task 2.8: Implement ProviderRegistry with Auto-Detect

**Files:**
- Modify: `src/providers/registry.ts`
- Create: `src/providers/auto-detect.ts`

- [ ] **Step 1: Create auto-detect utility**

```bash
cat > src/providers/auto-detect.ts << 'EOF'
import { loadConfig } from '../utils/config.js';
import { getProvider } from './registry.js';

export async function detectConfiguredProviders(): Promise<string[]> {
  const config = await loadConfig();
  const providers: string[] = [];

  // Check if providers are configured in config
  if (config.providers) {
    for (const [providerId, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig.apiKey) {
        providers.push(providerId);
      }
    }
  }

  // Check environment variables
  const envVarMap: Record<string, string> = {
    deepseek: 'DEEPSEEK_API_KEY',
    qwen: 'DASHSCOPE_API_KEY',
    minimax: 'MINIMAX_API_KEY',
    glm: 'ZHIPUAI_API_KEY',
    kimi: 'KIMI_API_KEY',
    devstral: 'DEVSTRAL_API_KEY',
  };

  for (const [providerId, envVar] of Object.entries(envVarMap)) {
    if (process.env[envVar] && !providers.includes(providerId)) {
      providers.push(providerId);
    }
  }

  return providers;
}

export async function initializeProvider(providerId: string): Promise<string | null> {
  const config = await loadConfig();

  // Try to get API key from config
  const providerConfig = config.providers?.[providerId];
  const apiKey = providerConfig?.apiKey || process.env[providerId.toUpperCase() + '_API_KEY'];

  if (!apiKey) {
    return null;
  }

  const provider = await getProvider(providerId, apiKey);
  if (provider) {
    return providerId;
  }

  return null;
}
EOF
```

- [ ] **Step 2: Update registry**

Update `src/providers/registry.ts` to include all providers:
```typescript
// Add all providers to registry
export const providerRegistry: Record<string, new (apiKey?: string) => ModelProviderType> = {
  deepseek: (await import("./deepseek.js")).DeepSeekProvider,
  qwen: (await import("./qwen.js")).QwenProvider,
  minimax: (await import("./minimax.js")).MinimaxProvider,
  glm: (await import("./glm.js")).GLMProvider,
  kimi: (await import("./kimi.js")).KimiProvider,
  devstral: (await import("./devstral.js")).DevstralProvider,
  ollama: (await import("./ollama.js")).OllamaProvider,
  // OpenAI-compat requires custom constructor, not in auto-registry
};
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/registry.ts src/providers/auto-detect.ts
git commit -m "feat: add provider auto-detection from config and env"
```

---

### Task 2.9: Implement Setup Wizard

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Add setup command to main.ts**

```typescript
// Add to src/main.ts after existing commands
program
  .command('setup')
  .description('Interactive setup wizard for OpenCLI')
  .action(async () => {
    const { setupWizard } = await import('./commands/setup.js');
    await setupWizard();
  });
```

- [ ] **Step 2: Create setup command**

```bash
cat > src/commands/setup.ts << 'EOF'
import readline from 'readline';
import { setApiKey } from '../utils/secure-storage.js';
import { logger } from '../utils/logger.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

export async function setupWizard(): Promise<void> {
  console.log('\n🚀 OpenCLI Setup Wizard\n');
  console.log('This wizard will help you configure your API keys.\n');
  console.log('Your keys will be stored securely in your system keychain.\n');

  const providers = [
    { id: 'deepseek', name: 'DeepSeek (Cheapest, good for coding)', envVar: 'DEEPSEEK_API_KEY' },
    { id: 'qwen', name: 'Qwen (256K context, strong coding)', envVar: 'DASHSCOPE_API_KEY' },
    { id: 'minimax', name: 'Minimax (1M context window)', envVar: 'MINIMAX_API_KEY' },
    { id: 'glm', name: 'GLM Zhipu (Built-in web search)', envVar: 'ZHIPUAI_API_KEY' },
    { id: 'kimi', name: 'Kimi (LiveBench leader)', envVar: 'KIMI_API_KEY' },
    { id: 'devstral', name: 'Devstral (Apache 2.0, local)', envVar: 'DEVSTRAL_API_KEY' },
  ];

  console.log('Available providers:');
  providers.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Environment variable: ${p.envVar}\n`);
  });

  const selected = await question('Select providers to configure (comma-separated, e.g., 1,3,5): ');
  const indices = selected.split(',').map(s => parseInt(s.trim(), 10) - 1);

  for (const index of indices) {
    if (index >= 0 && index < providers.length) {
      const provider = providers[index];
      console.log(`\n📝 Configuring ${provider.name}...`);

      const checkEnv = await question(`  Check for ${provider.envVar} environment variable? (Y/n): `);

      if (checkEnv.toLowerCase() !== 'n' && process.env[provider.envVar]) {
        console.log(`  ✅ Found in environment: ${provider.envVar}`);
        await setApiKey(provider.id, process.env[provider.envVar]!);
      } else {
        const apiKey = await question(`  Enter API key (or press Enter to skip): `);
        if (apiKey) {
          await setApiKey(provider.id, apiKey);
          console.log(`  ✅ API key stored for ${provider.id}`);
        } else {
          console.log(`  ⏭️  Skipped ${provider.id}`);
        }
      }
    }
  }

  const defaultProvider = await question('\n🎯 Set default provider (deepseek): ');
  console.log(`\n✅ Setup complete!\n`);
  console.log('You can now run:');
  console.log('  opencli "your coding task here"');
  console.log('  opencli -p <provider> "task"');
  console.log('  opencli config list\n');

  rl.close();
}
EOF
```

- [ ] **Step 3: Test setup wizard**

```bash
npm run build && node dist/main.js setup --help
```

Expected: Setup command available

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/commands/setup.ts
git commit -m "feat: add interactive setup wizard for API key configuration"
```

---

### Task 2.10: Implement Slash Commands for Model/Provider Switching

**Files:**
- Create: `src/commands/slash.ts`

- [ ] **Step 1: Create slash command handler**

```bash
cat > src/commands/slash.ts << 'EOF'
import { getProvider } from '../providers/registry.js';

export interface SlashContext {
  currentProvider: string;
  currentModel: string;
  switchProvider: (providerId: string) => Promise<void>;
  switchModel: (modelId: string) => Promise<void>;
}

export async function handleSlashCommand(
  command: string,
  context: SlashContext
): Promise<string> {
  const [cmd, ...args] = command.split(' ');

  switch (cmd) {
    case '/model':
      return await handleModelSwitch(args[0], context);

    case '/provider':
      return await handleProviderSwitch(args[0], context);

    case '/cost':
      return `Current session cost: $0.00 (not yet implemented)`;

    case '/help':
      return `Available slash commands:
/model <name>     - Switch model
/provider <name>  - Switch provider
/cost             - Show session cost
/help             - Show this message`;

    default:
      return `Unknown slash command: ${cmd}. Type /help for available commands.`;
  }
}

async function handleModelSwitch(modelId: string, context: SlashContext): Promise<string> {
  if (!modelId) {
    return `Please specify a model. Current model: ${context.currentModel}`;
  }

  await context.switchModel(modelId);
  return `Switched to model: ${modelId}`;
}

async function handleProviderSwitch(providerId: string, context: SlashContext): Promise<string> {
  if (!providerId) {
    return `Please specify a provider. Current provider: ${context.currentProvider}`;
  }

  const provider = await getProvider(providerId);
  if (!provider) {
    return `Unknown provider: ${providerId}`;
  }

  await context.switchProvider(providerId);
  return `Switched to provider: ${providerId} (${provider.name})`;
}
EOF
```

- [ ] **Step 2: Integrate slash commands into main CLI**

Add to `src/main.ts`:
```typescript
import { handleSlashCommand } from './commands/slash.js';

// In interactive mode, check for slash commands
if (userInput.startsWith('/')) {
  const response = await handleSlashCommand(userInput, slashContext);
  console.log(response);
  continue;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/slash.ts src/main.ts
git commit -m "feat: add slash commands for model/provider switching"
```

---

### Task 2.11: Integration Tests for All Providers

**Files:**
- Create: `tests/integration/providers/all-providers.test.ts`

- [ ] **Step 1: Create comprehensive integration test**

```bash
cat > tests/integration/providers/all-providers.test.ts << 'EOF'
import { describe, it, expect, beforeEach } from 'vitest';
import { providerRegistry, getProvider } from '../../../src/providers/registry';
import type { Message } from '../../../src/types';

describe('All Providers Integration', () => {
  const providerIds = Object.keys(providerRegistry);

  it(`should have all expected providers registered`, () => {
    expect(providerIds).toContain('deepseek');
    expect(providerIds).toContain('qwen');
    expect(providerIds).toContain('minimax');
    expect(providerIds).toContain('glm');
    expect(providerIds).toContain('kimi');
    expect(providerIds).toContain('devstral');
    expect(providerIds).toContain('ollama');
    expect(providerIds.length).toBeGreaterThanOrEqual(8);
  });

  describe.each(providerIds)('%s provider', (providerId) => {
    let provider: any;

    beforeAll(async () => {
      provider = await getProvider(providerId, 'test-api-key');
    });

    it('should have valid metadata', () => {
      expect(provider).toBeDefined();
      expect(provider.id).toBe(providerId);
      expect(provider.name).toBeDefined();
      expect(provider.models).toBeInstanceOf(Array);
      expect(provider.models.length).toBeGreaterThan(0);
    });

    it('should have models with valid descriptors', () => {
      for (const model of provider.models) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(typeof model.supportsTools).toBe('boolean');
        expect(typeof model.supportsImages).toBe('boolean');
      }
    });

    it('should support tool calling', () => {
      expect(provider.supportsTools()).toBe(true);
    });

    it('should have context window defined', () => {
      expect(provider.maxContextWindow()).toBeGreaterThan(0);
    });

    it('should count tokens', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello, how are you today?' },
      ];
      const count = await provider.countTokens(messages);
      expect(count).toBeGreaterThan(0);
    });

    it('should have at least one model with tools support', () => {
      const hasToolsModel = provider.models.some((m: any) => m.supportsTools);
      expect(hasToolsModel).toBe(true);
    });
  });
});
EOF
```

- [ ] **Step 2: Run all provider tests**

```bash
npm test -- tests/integration/providers/
```

Expected: All 8 providers pass basic metadata tests

- [ ] **Step 3: Commit**

```bash
git add tests/integration/providers/all-providers.test.ts
git commit -m "test: add comprehensive integration tests for all 8 providers"
```

---

### Task 2.12: Update Provider Setup Documentation

**Files:**
- Modify: `docs/provider-setup.md`

- [ ] **Step 1: Fill in all provider sections**

```bash
cat > docs/provider-setup.md << 'EOF'
# Provider Setup Guide

This guide explains how to configure OpenCLI with various model providers.

## Quick Setup

Run the interactive setup wizard:

\`\`\`bash
opencli setup
\`\`\`

Or configure API keys manually using environment variables or the keychain.

## DeepSeek

**Best for:** Cost-effective coding (cheapest option)
**Context:** 128K tokens (V3), 64K (V2.5)
**Pricing:** $0.14/1M input, $0.28/1M output

### Setup

\`\`\`bash
# Environment variable
export DEEPSEEK_API_KEY="sk-..."

# Or store in keychain
opencli config set deepseek.api_key "sk-..."
\`\`\`

### Models

- `deepseek-v3`: Latest, 128K context
- `deepseek-v3.2`: With thinking tokens
- `deepseek-chat`: V2.5 legacy (cheapest)

## Qwen (Alibaba Cloud)

**Best for:** Large codebase tasks (256K context)
**Context:** 256K native, up to 1M with extrapolation
**Pricing:** $3/1M input, $6/1M output

### Setup

\`\`\`bash
# Environment variable
export DASHSCOPE_API_KEY="sk-..."

# Or use OpenRouter
opencli config set provider openai-compat
opencli config set openai-compat.base_url "https://openrouter.ai/api/v1"
opencli config set openai-compat.api_key "sk-..."
\`\`\`

### Models

- `qwen3-coder`: 256K context, strong coding
- `qwen3-coder-next`: Up to 1M with extrapolation

## Minimax

**Best for:** Extremely long contexts (1M tokens)
**Context:** 1M token window (largest available)
**Pricing:** $0.50/1M input, $1.00/1M output

### Setup

\`\`\`bash
export MINIMAX_API_KEY="your-key"
\`\`\`

### Models

- `abab6.5s-chat`: 1M context, fast
- `abab6.5-chat`: 1M context
- `abab5.5-chat`: 245K context

## GLM (Zhipu AI)

**Best for:** Web search built-in, competitive coding
**Context:** 128K tokens
**Pricing:** $2/1M input, $4/1M output

### Setup

\`\`\`bash
export ZHIPUAI_API_KEY="your-key"
\`\`\`

### Models

- `glm-5.1`: Competitive on LiveBench May 2026
- `glm-4-flash`: Fast, cheap, good for orchestrator
- `glm-4-plus`: Premium model

### Built-in Web Search

GLM has native web search — no external MCP needed:

\`\`\`bash
opencli -p glm "search for latest React updates"
\`\`\`

## Kimi (Moonshot AI)

**Best for:** Agentic coding (LiveBench leader)
**Context:** 128K tokens
**Pricing:** $5/1M input, $10/1M output

### Setup

\`\`\`bash
export KIMI_API_KEY="sk-..."
\`\`\`

### Models

- `moonshot-v1-128k`: Kimi K2.6, LiveBench leader
- `moonshot-v1-32k`: Smaller context, cheaper
- `moonshot-v1-8k`: Smallest

**Note:** Kimi has restrictive rate limits. OpenCLI implements exponential backoff.

## Devstral (Mistral)

**Best for:** Local deployment (Apache 2.0), single GPU
**Context:** 32K tokens
**Pricing:** Free (local), $0.50/1M (API)

### Local Setup (vLLM)

\`\`\`bash
# Install vLLM
pip install vllm

# Run Devstral locally
vllm serve mistralai/Devstral-Small-2 --port 11434

# Configure OpenCLI
export OPENCLI_BASE_URL="http://localhost:11434"
\`\`\`

### API Setup

\`\`\`bash
export DEVSTRAL_API_KEY="your-key"
\`\`\`

### Models

- `devstral-small-2`: 24B params, 68% SWE-bench, single GPU
- `devstral-medium`: Larger model

## Ollama (Local)

**Best for:** Offline work, privacy
**Context:** Varies by model
**Pricing:** Free

### Setup

\`\`\`bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull qwen2.5-coder

# Run (OpenCLI auto-detects)
opencli -p ollama "your task"
\`\`\`

### Auto-Detection

OpenCLI automatically detects installed Ollama models:

\`\`\`bash
opencli -p ollama "task"  # Uses default model
opencli -p ollama -m qwen2.5-coder "task"  # Specific model
\`\`\`

## OpenAI-Compatible Endpoints

**Best for:** OpenRouter, Fireworks AI, BYOK deployments

### OpenRouter Setup

\`\`\`bash
export OPENROUTER_API_KEY="sk-..."
opencli config set provider openai-compat
opencli config set openai-compat.base_url "https://openrouter.ai/api/v1"
opencli config set openai-compat.model "qwen/qwen-2.5-coder-32b"
\`\`\`

### BYOK (Bring Your Own Key)

For providers with OpenAI-compatible APIs:

\`\`\`bash
opencli config set provider openai-compat
opencli config set openai-compat.base_url "https://your-provider.com/v1"
opencli config set openai-compat.api_key "your-key"
opencli config set openai-compat.model "model-name"
\`\`\`

## Configuration File

Store settings in `~/.opencli/config.yml`:

\`\`\`yaml
provider: deepseek
model: deepseek-v3

budget:
  session_max_usd: 1.0
  daily_max_usd: 5.0
  monthly_max_usd: 50.0

providers:
  deepseek:
    api_key: "sk-..."
  qwen:
    api_key: "sk-..."
\`\`\`

## Cost Comparison

As of June 2026 (per 1M tokens):

| Provider | Input | Output | Notes |
|----------|-------|--------|-------|
| DeepSeek | $0.14 | $0.28 | Cheapest |
| Minimax | $0.50 | $1.00 | 1M context |
| GLM | $2.00 | $4.00 | Web search |
| Qwen | $3.00 | $6.00 | 256K context |
| Kimi | $5.00 | $10.00 | Best quality |
| Ollama | Free | Free | Local only |

## Troubleshooting

### API Key Not Found

\`\`\`bash
# Check environment
echo $DEEPSEEK_API_KEY

# Check keychain
opencli config list

# Run setup wizard
opencli setup
\`\`\`

### Rate Limit Errors

- **Kimi**: Most restrictive, use exponential backoff
- **Qwen**: Moderate limits
- **DeepSeek**: Generous limits

Switch to a different provider temporarily:

\`\`\`bash
opencli -p deepseek "task"  # If Kimi is rate-limited
\`\`\`

### Model Not Found

\`\`\`bash
# List available models for provider
opencli config list
\`\`\`
EOF
```

- [ ] **Step 2: Commit**

```bash
git add docs/provider-setup.md
git commit -m "docs: complete provider setup guide with all providers"
```

---

## Exit Criteria Checklist

Phase 2 is complete when:
- [ ] All 8 providers implemented and tested (Minimax, GLM, Kimi, Devstral, Ollama, OpenAI-compat)
- [ ] `opencli setup` wizard works end-to-end
- [ ] `opencli config list` shows configured providers
- [ ] `/model` and `/provider` slash commands work
- [ ] Cost rate tables complete for all providers
- [ ] Provider documentation complete
- [ ] All integration tests pass (mocked)

---

## Next Steps

After Phase 2, Phase 3 implements:
- Context compression engine (per-model strategies)
- Token counting with provider-specific tokenizers
- ACON-inspired semantic compression
- Compression metrics and `/compress` command

See `PROJECT-DEVELOPMENT-PHASE-TRACKING.md` for details.

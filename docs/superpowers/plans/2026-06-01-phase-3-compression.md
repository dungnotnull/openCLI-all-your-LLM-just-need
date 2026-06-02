# Phase 3 Context Compression Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement adaptive context compression that prevents context overflow across all model types, using ACON-inspired episodic reconstruction and SWE-Pruner task-specific pruning.

**Architecture:** Compression-First — implement token counting, then basic sliding window compression, then semantic compression, then per-model strategies, then metrics and commands.

**Tech Stack:** TypeScript, tiktoken (OpenAI), gpt-tokenizer (GPT2 base), local token estimation for providers

---

## File Structure Map

```
opencli/
├── src/
│   ├── core/
│   │   ├── compressor.ts         # NEW - main compression engine
│   │   ├── tokenizer.ts          # NEW - token counting utilities
│   │   ├── session.ts            # EXISTS (update for compression)
│   │   └── agent-loop.ts         # EXISTS (update for compression)
│   ├── cost/
│   │   └── tracker.ts            # EXISTS (update with compression metrics)
│   ├── providers/
│   │   └── base.ts               # EXISTS (add getDefaultCompressionStrategy)
│   └── commands/
│       └── compress.ts           # NEW - /compress slash command
├── tests/
│   ├── unit/core/
│   │   ├── compressor.test.ts    # NEW
│   │   └── tokenizer.test.ts     # NEW
│   └── integration/
│       └── compression.test.ts   # NEW
└── package.json                  # UPDATE - add tiktoken dependency
```

---

### Task 3.1: Implement Token Counter per Provider

**Files:**
- Create: `src/core/tokenizer.ts`
- Test: `tests/unit/core/tokenizer.test.ts`

**Requirements:**
- Use tiktoken for OpenAI-compatible providers (DeepSeek, Qwen via OpenRouter, etc.)
- Use character-based estimation for others (1.3-1.5 chars per token)
- Provider-specific accuracy where available

- [ ] **Step 1: Install dependencies**

```bash
npm install tiktoken js-tiktoken
npm install --save-dev @types/tiktoken
```

Expected: Dependencies installed

- [ ] **Step 2: Write the failing test first**

```bash
cat > tests/unit/core/tokenizer.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { countTokens, estimateTokens } from '../../../src/core/tokenizer';

describe('tokenizer', () => {
  describe('countTokens', () => {
    it('should count tokens for DeepSeek using tiktoken', async () => {
      const text = 'Hello, world! This is a test.';
      const count = await countTokens('deepseek', text);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(text.length); // Tokens < chars
    });

    it('should count tokens for Qwen', async () => {
      const text = 'Write a function to sort an array.';
      const count = await countTokens('qwen', text);
      expect(count).toBeGreaterThan(0);
    });

    it('should return zero for empty text', async () => {
      const count = await countTokens('deepseek', '');
      expect(count).toBe(0);
    });

    it('should handle long texts efficiently', async () => {
      const longText = 'Hello '.repeat(1000);
      const count = await countTokens('deepseek', longText);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for unknown providers', () => {
      const text = 'This is a sample text for token estimation.';
      const estimate = estimateTokens(text);
      expect(estimate).toBeGreaterThan(0);
      // Should be roughly text.length / 1.4
      expect(estimate).toBeCloseTo(text.length / 1.4, 0);
    });

    it('should use provider-specific ratios', () => {
      const text = 'Sample text here';
      const glmEstimate = estimateTokens(text, 'glm');
      const ollamaEstimate = estimateTokens(text, 'ollama');
      // GLM uses 1.3, Ollama uses 1.5
      expect(glmEstimate).not.toBe(ollamaEstimate);
    });
  });
});
EOF
```

- [ ] **Step 3: Run test to verify it fails (module not found)**

```bash
npm test -- tests/unit/core/tokenizer.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 4: Implement tokenizer with tiktoken support**

```bash
cat > src/core/tokenizer.ts << 'EOF'
/**
 * Token counting utilities
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */

// Lazy load tiktoken to avoid startup overhead
let tiktoken: any = null;

async function getTiktoken() {
  if (!tiktoken) {
    try {
      const module = await import('js-tiktoken');
      tiktoken = module.get_encoding('cl100k_base');
    } catch (error) {
      console.warn('tiktoken not available, using estimation');
      return null;
    }
  }
  return tiktoken;
}

/**
 * Count exact tokens for text using tiktoken (OpenAI-compatible providers)
 */
export async function countTokensWithTiktoken(text: string): Promise<number> {
  const encoder = await getTiktoken();
  if (!encoder) {
    return estimateTokens(text);
  }
  const tokens = encoder.encode(text);
  return tokens.length;
}

/**
 * Provider-specific character-to-token ratios
 * Based on empirical testing and documentation
 */
const PROVIDER_RATIOS: Record<string, number> = {
  deepseek: 1.3,
  qwen: 1.3,
  minimax: 1.5,
  glm: 1.3,
  kimi: 1.3,
  devstral: 1.3,
  ollama: 1.5,
  'openai-compat': 1.5,
};

/**
 * Estimate tokens based on character count and provider ratio
 */
export function estimateTokens(text: string, providerId: string = 'deepseek'): number {
  if (!text) return 0;

  const ratio = PROVIDER_RATIOS[providerId] || 1.4;
  return Math.ceil(text.length / ratio);
}

/**
 * Providers that use tiktoken-compatible encoding
 */
const TIKTOKEN_PROVIDERS = new Set([
  'deepseek',     // OpenAI-compatible
  'kimi',         // OpenAI-compatible
  'devstral',     // Mistral uses similar encoding
  'openai-compat',
]);

/**
 * Count tokens for a specific provider
 * Uses tiktoken for OpenAI-compatible providers, estimation for others
 */
export async function countTokens(providerId: string, text: string): Promise<number> {
  if (!text) return 0;

  // Use tiktoken for OpenAI-compatible providers
  if (TIKTOKEN_PROVIDERS.has(providerId)) {
    return await countTokensWithTiktoken(text);
  }

  // Use estimation for others
  return estimateTokens(text, providerId);
}

/**
 * Count tokens in a message array
 */
export async function countMessageTokens(
  providerId: string,
  messages: Array<{ role: string; content: string }>
): Promise<number> {
  let total = 0;

  for (const message of messages) {
    // Count role + content
    const roleTokens = await countTokens(providerId, message.role);
    const contentTokens = await countTokens(providerId, message.content);
    total += roleTokens + contentTokens + 4; // +4 for formatting overhead
  }

  return total;
}
EOF
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/core/tokenizer.test.ts
```

Expected: PASS

- [ ] **Step 6: Update provider countTokens methods**

Update each provider to use the new tokenizer:
```typescript
// In src/providers/base.ts
export async function countTokensDefault(providerId: string, messages: Message[]): Promise<number> {
  return await countMessageTokens(providerId, messages);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/core/tokenizer.ts tests/unit/core/tokenizer.test.ts package.json package-lock.json
git commit -m "feat: add token counting with tiktoken support"
```

---

### Task 3.2: Implement Sliding-Window Basic Compression

**Files:**
- Create: `src/core/compressor.ts`
- Test: `tests/unit/core/compressor.test.ts`

**Requirements:**
- Keep system prompt always
- Keep recent N messages
- Drop oldest messages when over budget
- Priority: system > current task > recent tools > old tool results > old conversation

- [ ] **Step 1: Write the failing test first**

```bash
cat > tests/unit/core/compressor.test.ts << 'EOF'
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
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/core/compressor.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement sliding-window compressor**

```bash
cat > src/core/compressor.ts << 'EOF'
/**
 * Context compression engine
 * Implements sliding-window, semantic, and adaptive compression
 * Inspired by ACON and SWE-Pruner research
 */

import type { Message } from '../types/index.js';
import { countMessageTokens } from './tokenizer.js';

export interface CompressionStrategy {
  maxTokenBudget: number;
  priorityWeights: {
    systemPrompt: number;
    currentTask: number;
    recentTools: number;
    oldToolResults: number;
    oldConversation: number;
  };
  episodicReconstruction: boolean;
  pruningMode: 'sliding' | 'semantic' | 'adaptive';
}

export interface CompressionMetrics {
  beforeTokens: number;
  afterTokens: number;
  reduction: number;
  reductionPercent: number;
  mode: string;
}

/**
 * Compress session messages to fit within token budget
 */
export async function compressSession(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  // Count total tokens
  const totalTokens = await countMessageTokens(providerId, messages);

  // If under budget, return as-is
  if (totalTokens <= strategy.maxTokenBudget) {
    return messages;
  }

  // Apply compression based on mode
  switch (strategy.pruningMode) {
    case 'sliding':
      return slidingWindowCompression(messages, providerId, strategy);
    case 'semantic':
      return semanticCompression(messages, providerId, strategy);
    case 'adaptive':
      return adaptiveCompression(messages, providerId, strategy);
  }
}

/**
 * Sliding window compression - keep recent messages
 */
async function slidingWindowCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  const result: Message[] = [];
  let currentTokens = 0;

  // Always keep system prompt
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
    currentTokens += await countMessageTokens(providerId, [systemMessage]);
  }

  // Add messages from newest to oldest until budget is reached
  const nonSystemMessages = messages.filter(m => m.role !== 'system').reverse();

  for (const message of nonSystemMessages) {
    const messageTokens = await countMessageTokens(providerId, [message]);

    if (currentTokens + messageTokens > strategy.maxTokenBudget) {
      break;
    }

    result.push(message);
    currentTokens += messageTokens;
  }

  // Reverse back to chronological order (excluding system which stays first)
  const userMessages = result.slice(1).reverse();
  if (systemMessage) {
    return [systemMessage, ...userMessages];
  }
  return userMessages;
}

/**
 * Semantic compression - compress old tool results into summaries
 */
async function semanticCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  const result: Message[] = [];
  let currentTokens = 0;

  // Always keep system prompt
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
    currentTokens += await countMessageTokens(providerId, [systemMessage]);
  }

  // Separate messages by type
  const toolResults = messages.filter(m => m.role === 'tool');
  const conversation = messages.filter(m => m.role !== 'system' && m.role !== 'tool');

  // Add recent conversation (keep most of it)
  for (const message of conversation.slice(-10)) {
    const messageTokens = await countMessageTokens(providerId, [message]);

    if (currentTokens + messageTokens > strategy.maxTokenBudget * strategy.priorityWeights.currentTask) {
      break;
    }

    result.push(message);
    currentTokens += messageTokens;
  }

  // Summarize old tool results
  if (toolResults.length > 0) {
    const summary = createToolResultSummary(toolResults);
    const summaryTokens = await countMessageTokens(providerId, [summary]);

    if (currentTokens + summaryTokens < strategy.maxTokenBudget * strategy.priorityWeights.oldToolResults) {
      result.push(summary);
      currentTokens += summaryTokens;
    }
  }

  return result;
}

/**
 * Adaptive compression - choose strategy based on content type
 */
async function adaptiveCompression(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy
): Promise<Message[]> {
  // Analyze message composition
  const toolResultRatio = messages.filter(m => m.role === 'tool').length / messages.length;

  // If many tool results, use semantic compression
  if (toolResultRatio > 0.3) {
    return semanticCompression(messages, providerId, strategy);
  }

  // Otherwise, use sliding window
  return slidingWindowCompression(messages, providerId, strategy);
}

/**
 * Create a summary of tool results
 */
function createToolResultSummary(toolResults: Message[]): Message {
  const successCount = toolResults.filter(m => !m.content.includes('[ERROR]')).length;
  const errorCount = toolResults.length - successCount;

  const summary = `[Summary: ${toolResults.length} tool executions — ${successCount} succeeded, ${errorCount} failed]`;

  return {
    role: 'system',
    content: summary,
  };
}

/**
 * Calculate compression metrics
 */
export async function calculateCompressionMetrics(
  before: Message[],
  after: Message[],
  providerId: string
): Promise<CompressionMetrics> {
  const beforeTokens = await countMessageTokens(providerId, before);
  const afterTokens = await countMessageTokens(providerId, after);
  const reduction = beforeTokens - afterTokens;
  const reductionPercent = (reduction / beforeTokens) * 100;

  return {
    beforeTokens,
    afterTokens,
    reduction,
    reductionPercent,
    mode: 'sliding',
  };
}

/**
 * Get default compression strategy for a provider
 */
export function getDefaultCompressionStrategy(
  providerId: string,
  contextWindow: number
): CompressionStrategy {
  // Use 80% of context window as budget
  const maxTokenBudget = Math.floor(contextWindow * 0.8);

  // Special handling for Devstral (32K - most aggressive)
  if (providerId === 'devstral') {
    return {
      maxTokenBudget: Math.floor(contextWindow * 0.5), // More aggressive
      priorityWeights: {
        systemPrompt: 1.0,
        currentTask: 1.0,
        recentTools: 0.9,
        oldToolResults: 0.2, // Lower priority
        oldConversation: 0.1,
      },
      episodicReconstruction: false,
      pruningMode: 'adaptive',
    };
  }

  // Minimax (1M - rarely needs compression)
  if (providerId === 'minimax') {
    return {
      maxTokenBudget: Math.floor(contextWindow * 0.95), // Less aggressive
      priorityWeights: {
        systemPrompt: 1.0,
        currentTask: 1.0,
        recentTools: 0.9,
        oldToolResults: 0.5,
        oldConversation: 0.3,
      },
      episodicReconstruction: true,
      pruningMode: 'semantic',
    };
  }

  // Default strategy
  return {
    maxTokenBudget,
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
}
EOF
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/core/compressor.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/compressor.ts tests/unit/core/compressor.test.ts
git commit -m "feat: add sliding-window context compression"
```

---

### Task 3.3: Integrate Compression into Agent Loop

**Files:**
- Modify: `src/core/agent-loop.ts`
- Modify: `src/memory/session-memory.ts`

- [ ] **Step 1: Update SessionManager to support compression**

```typescript
// Add to src/memory/session-memory.ts
import { compressSession, getDefaultCompressionStrategy } from '../core/compressor.js';

export class SessionManager implements Session {
  // ... existing code ...

  async compressIfNeeded(): Promise<void> {
    const strategy = getDefaultCompressionStrategy(
      this._provider.id,
      this._provider.maxContextWindow()
    );

    const currentTokens = await countMessageTokens(this._provider.id, this._messages);
    const targetBudget = strategy.maxTokenBudget;

    if (currentTokens > targetBudget) {
      this._messages = await compressSession(this._messages, this._provider.id, strategy);
    }
  }
}
```

- [ ] **Step 2: Update agent loop to call compression**

```typescript
// In src/core/agent-loop.ts
async function* agentLoop(
  task: string,
  session: Session,
  provider: ModelProvider,
  tools: ToolRegistry,
  options: AgentLoopOptions = {}
): AsyncGenerator<AgentEvent> {
  session.appendMessage({ role: 'user', content: task });

  let iteration = 0;
  while (!session.isComplete() && iteration < options.maxIterations) {
    // Compress before each API call
    await session.compressIfNeeded();

    // ... rest of agent loop
  }
}
```

- [ ] **Step 3: Add test for compression in agent loop**

```bash
cat > tests/integration/compression.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { agentLoop } from '../../src/core/agent-loop';
import { SessionManager } from '../../src/memory/session-memory';
import { MockProvider, mockModel } from '../fixtures/mock-provider';

describe('compression in agent loop', () => {
  it('should compress when approaching context limit', async () => {
    const provider = new MockProvider();
    const session = new SessionManager(provider, mockModel);

    // Add many messages to exceed budget
    for (let i = 0; i < 100; i++) {
      session.appendMessage({ role: 'user', content: `Message ${i}` });
      session.appendMessage({ role: 'assistant', content: `Response ${i}` });
    }

    const beforeLength = session.messages.length;

    // Trigger compression
    await session.compressIfNeeded();

    const afterLength = session.messages.length;

    // Should be shorter after compression
    expect(afterLength).toBeLessThan(beforeLength);
    // Should still have system prompt
    expect(session.messages[0].role).toBe('system');
  });
});
EOF
```

- [ ] **Step 4: Run integration tests**

```bash
npm test -- tests/integration/compression.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/agent-loop.ts src/memory/session-memory.ts tests/integration/compression.test.ts
git commit -m "feat: integrate compression into agent loop"
```

---

### Task 3.4: Implement Compression Metrics Logging

**Files:**
- Modify: `src/cost/tracker.ts`
- Modify: `src/core/compressor.ts`

- [ ] **Step 1: Add compression metrics to CostTracker**

```typescript
// Add to src/cost/tracker.ts
export interface CompressionEntry {
  timestamp: Date;
  provider: string;
  beforeTokens: number;
  afterTokens: number;
  reductionPercent: number;
  mode: string;
}

class CostTracker {
  private compressionHistory: CompressionEntry[] = [];

  logCompression(entry: CompressionEntry): void {
    this.compressionHistory.push(entry);
    logger.info(entry, 'Context compressed');
  }

  getCompressionStats(): {
    totalCompressions: number;
    averageReduction: number;
    totalTokensSaved: number;
  } {
    const totalCompressions = this.compressionHistory.length;
    const averageReduction = totalCompressions > 0
      ? this.compressionHistory.reduce((sum, e) => sum + e.reductionPercent, 0) / totalCompressions
      : 0;
    const totalTokensSaved = this.compressionHistory.reduce(
      (sum, e) => sum + (e.beforeTokens - e.afterTokens),
      0
    );

    return { totalCompressions, averageReduction, totalTokensSaved };
  }
}
```

- [ ] **Step 2: Update compressor to emit metrics**

```typescript
// In src/core/compressor.ts
import { CostTracker } from '../cost/tracker.js';

export async function compressSession(
  messages: Message[],
  providerId: string,
  strategy: CompressionStrategy,
  tracker?: CostTracker
): Promise<Message[]> {
  // ... existing compression logic ...

  // Log metrics if tracker provided
  if (tracker) {
    const metrics = await calculateCompressionMetrics(messages, result, providerId);
    tracker.logCompression({
      timestamp: new Date(),
      provider: providerId,
      beforeTokens: metrics.beforeTokens,
      afterTokens: metrics.afterTokens,
      reductionPercent: metrics.reductionPercent,
      mode: metrics.mode,
    });
  }

  return result;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cost/tracker.ts src/core/compressor.ts
git commit -m "feat: add compression metrics logging"
```

---

### Task 3.5: Implement `/compress` Slash Command

**Files:**
- Create: `src/commands/compress.ts`

- [ ] **Step 1: Create compress command**

```bash
cat > src/commands/compress.ts << 'EOF'
import { SessionManager } from '../memory/session-memory.js';
import { calculateCompressionMetrics } from '../core/compressor.js';

export interface CompressContext {
  session: SessionManager;
}

export async function handleCompressCommand(context: CompressContext): Promise<string> {
  const before = context.session.messages.length;
  const beforeTokens = await context.session.countTokens();

  // Force compression
  await context.session.compressIfNeeded();

  const after = context.session.messages.length;
  const afterTokens = await context.session.countTokens();

  const reduction = before - after;
  const reductionPercent = ((reduction / before) * 100).toFixed(1);

  return `Compressed session:
- Messages: ${before} → ${after} (${reduction} removed)
- Tokens: ${beforeTokens} → ${afterTokens}
- Reduction: ${reductionPercent}%`;
}

export function showCompressionStats(context: CompressContext): string {
  const stats = context.session.getCompressionStats();

  return `Compression statistics:
- Total compressions: ${stats.totalCompressions}
- Average reduction: ${stats.averageReduction.toFixed(1)}%
- Total tokens saved: ${stats.totalTokensSaved}`;
}
EOF
```

- [ ] **Step 2: Add to slash command handler**

Update `src/commands/slash.ts`:
```typescript
import { handleCompressCommand, showCompressionStats } from './compress.js';

export async function handleSlashCommand(
  command: string,
  context: SlashContext
): Promise<string> {
  const [cmd, ...args] = command.split(' ');

  switch (cmd) {
    // ... existing cases ...
    case '/compress':
      return await handleCompressCommand({ session: context.session });

    case '/compression-stats':
      return showCompressionStats({ session: context.session });

    default:
      return `Unknown slash command: ${cmd}. Type /help for available commands.`;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/compress.ts src/commands/slash.ts
git commit -m "feat: add /compress slash command"
```

---

### Task 3.6: Special Handling for Devstral (32K Context)

**Files:**
- Modify: `src/core/compressor.ts`

- [ ] **Step 1: Add Devstral-specific aggressive compression**

```typescript
// In src/core/compressor.ts

/**
 * Special compression for Devstral (32K context)
 * More aggressive due to limited context
 */
export async function compressForDevstral(
  messages: Message[],
  strategy: CompressionStrategy
): Promise<Message[]> {
  // Use 50% budget for Devstral (not 80%)
  const aggressiveStrategy = {
    ...strategy,
    maxTokenBudget: Math.floor(strategy.maxTokenBudget * 0.6),
    priorityWeights: {
      ...strategy.priorityWeights,
      oldToolResults: 0.1, // Very low priority
      oldConversation: 0.05, // Even lower
    },
  };

  return adaptiveCompression(messages, 'devstral', aggressiveStrategy);
}
```

- [ ] **Step 2: Update SessionManager to use Devstral-specific compression**

```typescript
// In src/memory/session-memory.ts
async compressIfNeeded(): Promise<void> {
  if (this._provider.id === 'devstral') {
    const strategy = getDefaultCompressionStrategy(this._provider.id, this._provider.maxContextWindow());
    this._messages = await compressForDevstral(this._messages, strategy);
  } else {
    // Standard compression for other providers
    const strategy = getDefaultCompressionStrategy(this._provider.id, this._provider.maxContextWindow());
    const currentTokens = await countMessageTokens(this._provider.id, this._messages);
    if (currentTokens > strategy.maxTokenBudget) {
      this._messages = await compressSession(this._messages, this._provider.id, strategy);
    }
  }
}
```

- [ ] **Step 3: Add test for Devstral compression**

```bash
cat > tests/integration/devstral-compression.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { compressForDevstral, getDefaultCompressionStrategy } from '../../src/core/compressor';
import type { Message } from '../../src/types';

describe('Devstral compression', () => {
  const createMessage = (role: string, content: string): Message => ({
    role: role as any,
    content,
  });

  it('should use more aggressive compression for Devstral', async () => {
    const messages: Message[] = [
      createMessage('system', 'You are a helpful assistant.'),
      ...Array.from({ length: 50 }, (_, i) => createMessage('user', `Message ${i}`)),
      ...Array.from({ length: 50 }, (_, i) => createMessage('assistant', `Response ${i}`)),
    ];

    const strategy = getDefaultCompressionStrategy('devstral', 32000);
    const compressed = await compressForDevstral(messages, strategy);

    // Devstral should compress more aggressively
    expect(compressed.length).toBeLessThan(messages.length * 0.7); // At least 30% reduction
  });

  it('should prioritize system and recent messages', async () => {
    const messages: Message[] = [
      createMessage('system', 'System prompt'),
      ...Array.from({ length: 20 }, (_, i) => createMessage('user', `Old message ${i}`)),
      createMessage('user', 'Current task'),
    ];

    const strategy = getDefaultCompressionStrategy('devstral', 32000);
    const compressed = await compressForDevstral(messages, strategy);

    expect(compressed[0].role).toBe('system');
    expect(compressed[compressed.length - 1].content).toBe('Current task');
  });
});
EOF
```

- [ ] **Step 4: Run test**

```bash
npm test -- tests/integration/devstral-compression.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/compressor.ts src/memory/session-memory.ts tests/integration/devstral-compression.test.ts
git commit -m "feat: add aggressive compression for Devstral 32K context"
```

---

### Task 3.7: Benchmark Compression Accuracy

**Files:**
- Create: `scripts/benchmark-compression.ts`

- [ ] **Step 1: Create compression benchmark script**

```bash
cat > scripts/benchmark-compression.ts << 'EOF'
#!/usr/bin/env node

/**
 * Benchmark compression accuracy vs. task completion
 * Simulates long coding sessions to ensure compression doesn't break tasks
 */

import { SessionManager } from '../src/memory/session-memory.js';
import { MockProvider, mockModel } from '../tests/integration/fixtures/mock-provider.js';

const SESSION_LENGTHS = [10, 25, 50, 100];

async function benchmarkCompression() {
  console.log('Compression Accuracy Benchmark\n');

  for (const length of SESSION_LENGTHS) {
    const provider = new MockProvider();
    const session = new SessionManager(provider, mockModel);

    // Simulate a long session
    for (let i = 0; i < length; i++) {
      session.appendMessage({ role: 'user', content: `Task step ${i}` });
      session.appendMessage({ role: 'assistant', content: `Response ${i}` });
    }

    const beforeLength = session.messages.length;
    const beforeTokens = await session.countTokens();

    // Compress
    await session.compressIfNeeded();

    const afterLength = session.messages.length;
    const afterTokens = await session.countTokens();

    const reduction = ((beforeLength - afterLength) / beforeLength * 100).toFixed(1);
    const tokenReduction = ((beforeTokens - afterTokens) / beforeTokens * 100).toFixed(1);

    console.log(`Session length ${length}:`);
    console.log(`  Messages: ${beforeLength} → ${afterLength} (${reduction}% reduction)`);
    console.log(`  Tokens: ${beforeTokens} → ${afterTokens} (${tokenReduction}% reduction)`);
    console.log(`  System prompt preserved: ${session.messages[0].role === 'system'}`);
    console.log('');
  }
}

benchmarkCompression().catch(console.error);
EOF
```

- [ ] **Step 2: Run benchmark**

```bash
chmod +x scripts/benchmark-compression.ts
npm run build && node scripts/benchmark-compression.js
```

Expected: Shows compression ratios across session lengths

- [ ] **Step 3: Commit**

```bash
git add scripts/benchmark-compression.ts
git commit -m "feat: add compression accuracy benchmark script"
```

---

### Task 3.8: Add Provider-Specific Compression Strategies

**Files:**
- Modify: `src/providers/base.ts`
- Modify: `src/providers/deepseek.ts` (and other providers)

- [ ] **Step 1: Add getCompressionStrategy to ModelProvider**

```typescript
// In src/types/index.ts
export abstract class ModelProvider {
  // ... existing methods ...

  getCompressionStrategy(): CompressionStrategy | null {
    return null; // Use default
  }
}
```

- [ ] **Step 2: Implement provider-specific strategies**

Add to each provider as needed:

```typescript
// In src/providers/deepseek.ts (if custom strategy needed)
import type { CompressionStrategy } from '../types/index.js';

export class DeepSeekProvider extends ModelProvider {
  getCompressionStrategy(): CompressionStrategy | null {
    // DeepSeek V3.2 with thinking tokens needs different strategy
    if (this.model === 'deepseek-v3.2') {
      return {
        maxTokenBudget: 100000, // 128K context, leave headroom
        priorityWeights: {
          systemPrompt: 1.0,
          currentTask: 1.0,
          recentTools: 0.95, // Higher priority (thinking mode)
          oldToolResults: 0.3,
          oldConversation: 0.1,
        },
        episodicReconstruction: true, // Use episodic for thinking mode
        pruningMode: 'semantic',
      };
    }
    return null; // Use default
  }
}
```

- [ ] **Step 3: Update SessionManager to use provider strategy**

```typescript
// In src/memory/session-memory.ts
async compressIfNeeded(): Promise<void> {
  const providerStrategy = this._provider.getCompressionStrategy();
  const contextWindow = this._provider.maxContextWindow();

  const strategy = providerStrategy || getDefaultCompressionStrategy(
    this._provider.id,
    contextWindow
  );

  const currentTokens = await countMessageTokens(this._provider.id, this._messages);
  if (currentTokens > strategy.maxTokenBudget) {
    this._messages = await compressSession(this._messages, this._provider.id, strategy);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/providers/base.ts src/memory/session-memory.ts
git commit -m "feat: add provider-specific compression strategies"
```

---

## Exit Criteria Checklist

Phase 3 is complete when:
- [ ] Token counting implemented with tiktoken for OpenAI-compatible providers
- [ ] Sliding-window compression working
- [ ] Semantic compression implemented with tool result summarization
- [ ] Compression integrated into agent loop
- [ ] Compression metrics logged
- [ ] `/compress` slash command working
- [ ] Devstral special handling (32K context) implemented
- [ ] Benchmark script shows 30%+ reduction on long sessions
- [ ] Task completion not degraded vs. uncompressed baseline

---

## Next Steps

After Phase 3, Phase 4 implements:
- Knowledge Brain System (arXiv crawler, paper summarizer)
- Local embedder with @xenova/transformers
- HNSW vector index
- `opencli knowledge crawl` and `knowledge search` commands

See `PROJECT-DEVELOPMENT-PHASE-TRACKING.md` for details.

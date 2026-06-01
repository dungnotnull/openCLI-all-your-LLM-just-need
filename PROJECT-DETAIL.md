# PROJECT-detail.md — OpenCLI Full Architecture & Design Specification

> Version: 0.1.0-draft  
> Last Updated: 2026-05-31  
> Status: Pre-development, specification phase

---

## 1. Executive Summary

### Problem Statement

The AI coding CLI space in 2026 is bifurcated:

- **Closed-source CLIs** (Claude Code, Gemini CLI): Feature-rich, polished, but locked to proprietary models and expensive API tiers.
- **Open-source CLIs** (Qwen-Code, open-claude-code, Aider, OpenCode): Either forked from proprietary code (inheriting their limitations), focused on a single model family, or lacking critical production features like cost tracking, intelligent context compression, and self-improving knowledge systems.

**The gap nobody has closed:**
1. A truly provider-agnostic CLI that treats DeepSeek, Qwen, Minimax, GLM, Kimi, and Devstral as first-class citizens — not afterthoughts via an OpenAI-compat shim.
2. Automatic context compression tuned to each model's specific constraints (not just generic truncation).
3. A self-improving knowledge brain that gets better at using each model over time by ingesting the latest research.
4. Real-time cost tracking and budget enforcement across providers with wildly different pricing.
5. Multi-agent task decomposition that intelligently routes sub-tasks to the cheapest/fastest appropriate model.

### Solution

**OpenCLI** is an open-source, TypeScript-based terminal agent that:
- Provides a unified, elegant interface for 10+ open-source model providers
- Implements adaptive context compression specific to each model's architecture
- Maintains a living knowledge corpus (SECOND-KNOWLEDGE-BRAIN.md) updated by automated crawlers
- Tracks costs in real time with configurable budget guards
- Routes sub-tasks to specialized models via a lightweight multi-agent orchestrator

---

## 2. Competitive Analysis

| Feature | Claude Code | Gemini CLI | Qwen-Code | Aider | OpenCLI (ours) |
|---|---|---|---|---|---|
| Open source | ❌ | ✅ | ✅ | ✅ | ✅ |
| Multi-provider | ❌ | ❌ | Partial | Partial | ✅ Full |
| DeepSeek first-class | ❌ | ❌ | ❌ | Shim | ✅ |
| Qwen first-class | ❌ | ❌ | ✅ | Shim | ✅ |
| Minimax / GLM / Kimi | ❌ | ❌ | ❌ | ❌ | ✅ |
| Local model (Ollama) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Adaptive context compression | ❌ | ❌ | ❌ | Basic | ✅ Advanced |
| Real-time cost tracking | ❌ | ❌ | ❌ | ❌ | ✅ |
| Budget limits | ❌ | ❌ | ❌ | ❌ | ✅ |
| Self-improving knowledge brain | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-agent sub-task routing | ✅ Limited | ❌ | ❌ | ❌ | ✅ |
| MCP protocol support | ✅ | ✅ | ✅ | ❌ | ✅ |
| Offline/local-first mode | ❌ | ❌ | ❌ | ✅ | ✅ |
| Model benchmarking built-in | ❌ | ❌ | ❌ | ❌ | ✅ |
| Research paper crawler | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLI Entry (main.ts)                        │
│                  Commander.js · Ink Terminal UI                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │         Session Manager        │
              │   (config, auth, cost budget)  │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │        Core Agent Loop         │  ← Async generator loop
              │  plan → tool_call → observe   │     (inspired by Claude Code
              │  → reflect → next_action       │      source architecture)
              └──┬───────────────────────┬─────┘
                 │                       │
    ┌────────────▼──────┐   ┌────────────▼──────────┐
    │   Tool Registry   │   │   Provider Adapter     │
    │ bash · file · git │   │  DeepSeek · Qwen ·    │
    │ search · mcp-bridge│   │  Minimax · GLM ·      │
    └────────────┬──────┘   │  Kimi · Devstral ·    │
                 │           │  Ollama · OAI-compat  │
                 │           └────────────┬──────────┘
                 │                        │
    ┌────────────▼────────────────────────▼──────────┐
    │               Context Compressor                │
    │  Adaptive per-model · SWE-Pruner logic ·       │
    │  ACON-style episodic reconstruction             │
    └────────────────────────┬───────────────────────┘
                             │
    ┌────────────────────────▼───────────────────────┐
    │              Memory & Knowledge Layer           │
    │  Session Memory · Persistent Store ·           │
    │  SECOND-KNOWLEDGE-BRAIN.md interface ·         │
    │  Semantic embedding index                      │
    └────────────────────────┬───────────────────────┘
                             │
    ┌────────────────────────▼───────────────────────┐
    │           Knowledge Crawler (background)        │
    │  arXiv · GitHub docs · HuggingFace · Papers     │
    │  Scheduled nightly · Manual trigger available   │
    └────────────────────────────────────────────────┘
```

---

## 4. Core Modules — Detailed Design

### 4.1 Agent Loop (`src/core/agent-loop.ts`)

Based on analysis of the Claude Code source architecture (leaked March 2026) and the VILA-Lab research paper "Dive into Claude Code", the agent loop follows:

```typescript
async function* agentLoop(
  task: string,
  session: Session,
  provider: ModelProvider,
  tools: ToolRegistry,
): AsyncGenerator<AgentEvent> {
  while (!session.isComplete()) {
    const compressed = await compressContext(session.messages, provider);
    const response = await provider.chat(compressed, { tools: tools.schemas() });
    
    for await (const delta of response) {
      yield { type: 'delta', data: delta };
      
      if (delta.type === 'tool_use') {
        const result = await tools.execute(delta.tool_name, delta.input);
        session.appendToolResult(delta.tool_use_id, result);
        yield { type: 'tool_result', data: result };
      }
    }
    
    session.appendAssistantMessage(response.finalMessage);
    
    if (response.stopReason === 'end_turn' && !session.hasPendingTools()) {
      session.complete();
    }
  }
}
```

Key design decisions:
- **Async generator** yields events for streaming UI updates without blocking
- **Context compression** happens before every model call, not just when hitting limits
- **Tool execution** is synchronous within the loop to maintain correct conversation order
- **Session state** is immutable snapshots for easy serialization/recovery

### 4.2 Provider Adapter System (`src/providers/`)

Each provider implements the `ModelProvider` interface. Differences between providers:

**DeepSeek specifics:**
- Tool-calling schema: standard OpenAI-compatible, but `thinking` tokens need special handling in DeepSeek-V3.2 "Thinking in Tool-Use" mode
- Context window: 128K (V3), 64K (V2.5)
- Pricing tier: extremely low (key selling point)
- Special: `retain_chain_of_thought=true` parameter for V3.2

**Qwen specifics:**
- Qwen3-Coder-Next: 256K native context, up to 1M with extrapolation
- Tool schema: OpenAI-compatible but with `enable_thinking` flag for hybrid reasoning
- Requires `X-DashScope-SSE: enable` header for streaming
- Qwen-Code specific: supports reading entire directory trees via virtual filesystem tool

**Minimax specifics:**
- MiniMax-Text-01 / MiniMax-01: 1M token context window (largest available)
- Uses `abab` model naming convention
- Tool-calling supported via `tools` parameter (OpenAI-compatible)
- Unique: supports `bot_setting` for persona configuration

**GLM (Zhipu AI) specifics:**
- GLM-5.1: competitive on agentic coding per LiveBench May 2026
- Uses `zhipuai` Python SDK or HTTP API
- Supports `tools` in standard OpenAI format
- web_search tool built-in (no external MCP needed)

**Kimi (Moonshot AI) specifics:**
- Kimi K2.6: leads on agentic coding benchmarks as of May 2026
- 128K context, strong on multi-file editing
- Standard OpenAI-compatible API
- Rate limits more restrictive than others — implement exponential backoff

**Devstral (Mistral) specifics:**
- Devstral Small 2: 24B params, runs on single RTX 4090 or Mac 32GB RAM
- Apache 2.0 license — most permissive
- Supports image inputs (multimodal)
- vLLM-compatible for local deployment

**Ollama (local) specifics:**
- OpenAI-compatible API at `http://localhost:11434`
- No cost tracking needed (free)
- Limited tool-calling on smaller models — implement graceful fallback
- Detect available models automatically via `/api/tags`

### 4.3 Context Compression Engine (`src/core/compressor.ts`)

Inspired by two key research papers in SECOND-KNOWLEDGE-BRAIN.md:
- **ACON** (Optimizing Context Compression for Long-horizon LLM Agents): 26-54% memory reduction while maintaining performance
- **SWE-Pruner** (Self-Adaptive Context Pruning for Coding Agents): task-specific pruning for coding workflows

Compression strategy per model:

```typescript
interface CompressionStrategy {
  maxTokenBudget: number;          // Hard limit for this provider
  priorityWeights: {
    systemPrompt: number;          // Never compress (1.0)
    currentTask: number;           // Never compress (1.0)  
    recentTools: number;           // High priority (0.9)
    oldToolResults: number;        // Compressible (0.3)
    oldConversation: number;       // Low priority (0.1)
  };
  episodicReconstruction: boolean; // Use ACON-style reconstruction
  pruningMode: 'sliding' | 'semantic' | 'adaptive';
}
```

Model-specific budgets (from provider specs):
- Minimax-01: 900K tokens (leave 100K headroom)
- Qwen3-Coder: 230K tokens (leave 26K headroom)
- Kimi K2.6: 100K tokens
- DeepSeek V3: 100K tokens
- GLM-5.1: 128K tokens
- Devstral Small 2: 32K tokens → aggressive compression needed
- Ollama (varies): detect at runtime

### 4.4 Knowledge Brain System (`src/knowledge/`)

This is OpenCLI's primary differentiator — a continuously updated knowledge corpus that makes the agent smarter over time.

**Crawler targets:**

| Source | Endpoint | Cadence | Topics |
|---|---|---|---|
| arXiv | `export.arxiv.org/api/query` | Nightly | cs.AI, cs.SE, cs.LG |
| Semantic Scholar | `api.semanticscholar.org` | Weekly | agent systems, coding |
| HuggingFace Papers | `huggingface.co/papers` | Daily | new model releases |
| GitHub Releases | `api.github.com/repos/*/releases` | Daily | DeepSeek, Qwen, Minimax repos |
| Papers With Code | `paperswithcode.com/api` | Weekly | SWE-bench leaderboard |
| Anthropic Docs | Sitemap crawl | Weekly | Best practices reference |

**Crawl → Parse → Store pipeline:**

```
arXiv API → fetch abstract + full text (if open) 
         → LLM summarization (cheap model: DeepSeek V2.5 Lite)
         → Extract: key_insight, relevance_to_opencli, applied_modules
         → Embed with sentence-transformers (local, no API cost)
         → Append to SECOND-KNOWLEDGE-BRAIN.md
         → Update embedding index (~/.opencli/knowledge-index/)
```

**At agent startup:** the agent reads the most semantically similar 5-10 knowledge entries to the current task from the index and injects them into the system prompt. This is how accumulated research makes the agent progressively smarter.

### 4.5 Cost Tracker (`src/cost/tracker.ts`)

```typescript
interface CostEntry {
  timestamp: Date;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  taskId: string;
}

class CostTracker {
  // Per-session accumulated cost
  sessionTotal(): number;
  
  // Per-day / per-month rolling totals
  rollingTotal(period: 'day' | 'week' | 'month'): number;
  
  // Check against budget limits
  checkBudget(): 'ok' | 'warning' | 'exceeded';
  
  // Display in terminal UI
  render(): React.ReactElement;  // Ink component
}
```

Budget configuration in `~/.opencli/config.yml`:
```yaml
budget:
  session_max_usd: 1.00
  daily_max_usd: 5.00
  monthly_max_usd: 50.00
  warn_at_percent: 80
  hard_stop: true
```

### 4.6 Multi-Agent Task Router (`src/core/planner.ts`)

For complex tasks, OpenCLI can decompose into sub-tasks and route each to the optimal model:

```
User task: "Refactor auth module, write tests, update docs"
     │
     ▼
Planner decomposes:
  ├─ [code-heavy] Refactor auth → route to: Kimi K2.6 (best agentic coding)
  ├─ [test-writing] Write tests → route to: Qwen3-Coder (strong test gen)
  └─ [text-heavy] Update docs  → route to: DeepSeek V2.5 Lite (cheap text)
     │
     ▼
Orchestrator agent (lightweight, GLM-4-Flash) coordinates results
     │
     ▼
Merge & present to user
```

This "split-route-merge" pattern minimizes cost while maximizing quality.

---

## 5. User Experience & CLI Interface

### 5.1 Installation

```bash
# npm (primary)
npm install -g opencli

# Homebrew (macOS)
brew install opencli

# Direct binary (all platforms)
curl -fsSL https://opencli.dev/install.sh | sh
```

### 5.2 First Run

```bash
opencli setup
# Guides through:
# 1. Provider selection (multi-select)
# 2. API key entry per provider  
# 3. Default model selection
# 4. Budget configuration
# 5. Knowledge brain initialization (downloads base index)
```

### 5.3 Core Commands

```bash
opencli                          # Interactive mode (default)
opencli "fix the auth bug"       # One-shot task
opencli -p qwen "explain this"   # Use specific provider
opencli -m deepseek-v3 "..."     # Use specific model
opencli --cost                   # Show cost dashboard
opencli benchmark                # Run model comparison
opencli knowledge crawl          # Manual knowledge update
opencli knowledge search "MoE"   # Search knowledge brain
opencli config                   # Open config editor
opencli /help                    # Slash commands reference
```

### 5.4 Slash Commands (in interactive mode)

```
/model <name>         Switch model mid-conversation
/provider <name>      Switch provider mid-conversation  
/cost                 Show current session cost
/compress             Force context compression now
/memory               Show session memory contents
/knowledge <query>    Search knowledge brain
/benchmark            Quick model comparison on current task
/clear                Clear context (new session)
/multiagent           Enable multi-agent routing for next task
/offline              Switch to local Ollama model
/diff                 Show pending file changes before applying
/undo                 Revert last file change
```

### 5.5 Terminal UI Components

Built with **Ink** (React for terminal):

- `<CostMeter />` — live token count + USD cost in top-right corner
- `<ModelBadge />` — current model name + provider indicator
- `<ThinkingSpinner />` — animated indicator during model reasoning
- `<DiffViewer />` — color-coded diff with approve/reject controls
- `<KnowledgePulse />` — subtle indicator when knowledge brain was consulted
- `<BudgetBar />` — progress bar approaching budget limit

---

## 6. Open-Source Gap Features

Features not found in any existing CLI that OpenCLI introduces:

### 6.1 Adaptive Context Compression Per Model
Unlike generic truncation, OpenCLI uses ACON-inspired episodic reconstruction: rather than deleting old context, it compresses it into semantic summaries that the model can reference. Reduces token usage by 26-54% while maintaining task continuity.

### 6.2 Self-Improving Knowledge Brain
Every night, the crawler ingests new arXiv papers, GitHub releases, and docs related to coding agents, open-source LLMs, and tool use. The agent's behavior improves automatically as the knowledge base grows. No manual updates needed.

### 6.3 Real-Time Cost Tracking + Budget Guards
Other CLIs either hide costs or don't track them. OpenCLI shows per-call and cumulative costs live in the terminal, with configurable hard stops before you hit a budget limit.

### 6.4 Model Benchmarking Built-In
`opencli benchmark` runs your current task on multiple models simultaneously and presents a cost/quality comparison table. Helps users find the best model for their specific workflow.

### 6.5 Multi-Agent Task Decomposition
Complex tasks are decomposed by a lightweight orchestrator that routes subtasks to specialized models, minimizing cost while maximizing quality. Claude Code offers basic multi-agent; no open-source CLI does this.

### 6.6 Provider-Native Tool Schema Handling
Most multi-provider CLIs use a generic OpenAI-compat shim. OpenCLI implements native tool schemas for each provider, unlocking provider-specific features (DeepSeek's reasoning retention, Qwen's enable_thinking, Minimax's bot_setting, GLM's built-in web search).

### 6.7 Offline / Local-First Mode
`opencli --offline` routes everything to a locally running Ollama instance. Context compression becomes even more critical here (smaller models, tighter windows). The knowledge brain is pre-indexed locally, so semantic search works offline.

### 6.8 Configuration Profiles
`opencli profile use work` — switch between saved configuration profiles (different providers, models, budget limits, system prompts). Useful for managing personal vs. professional contexts.

---

## 7. Technical Stack

| Component | Technology | Rationale |
|---|---|---|
| Language | TypeScript 5.x | Type safety, ecosystem compatibility with Claude Code/Qwen-Code codebases |
| CLI parser | Commander.js | Industry standard, matches Claude Code |
| Terminal UI | Ink (React for terminal) | Reactive, component-based, matches Claude Code architecture |
| HTTP client | undici + fetch API | Modern, streaming-friendly |
| Config | YAML + cosmiconfig | Standard developer tooling |
| Embeddings | `@xenova/transformers` (WASM) | Local embedding with no API cost |
| Vector index | `hnswlib-node` | Fast approximate nearest-neighbor search, no external DB |
| Testing | Vitest | Fast, ESM-native, compatible with TypeScript |
| Linting | ESLint + Prettier | Standard |
| CI | GitHub Actions | Build, test, publish to npm |
| Package | npm + optional Homebrew | Wide distribution |

---

## 8. Security & Privacy

- **API keys** stored in OS keychain (macOS Keychain, Linux Secret Service, Windows Credential Manager) via `keytar`, never in plaintext config files
- **Local-first** architecture: no telemetry, no data sent to OpenCLI servers
- **Permission prompts** before any destructive tool use (file write, bash execution)
- **Sandboxed execution** option: run bash tools in a Docker container via `--sandbox` flag
- **Audit log**: all tool calls logged to `~/.opencli/audit.log` with timestamps

---

## 9. Monetization & Community Strategy

OpenCLI is free and open-source (Apache 2.0). Sustainability through:

1. **GitHub Sponsors / Open Collective** for individual contributors
2. **Enterprise support contracts** for teams needing SLA, custom providers, SSO
3. **Hosted knowledge brain** (optional, paid): premium paper corpus with higher-frequency updates and domain-specific tracks (security, ML, web dev)
4. **Provider referral relationships** (transparent disclosure): API credit partnerships with DeepSeek, Qwen, Minimax for new user onboarding

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provider API schema changes break adapters | High | High | Provider integration tests run daily in CI against real APIs |
| Open-source models improve rapidly, making architecture stale | High | Medium | Knowledge brain crawler tracks model releases; architecture is provider-swappable by design |
| Context compression causes task failures | Medium | High | Fall back to simple truncation if compressed context causes errors; log & learn |
| arXiv crawler rate limits | Medium | Low | Respect `crawl-delay` in robots.txt; cache aggressively; use Semantic Scholar as backup |
| Budget guard false positives blocking agent mid-task | Low | Medium | Warn at 80%, hard stop at 100%, allow `--ignore-budget` override with confirmation |
| Ink terminal UI compatibility on Windows | Medium | Medium | Provide plain-text fallback mode `--no-ui`; Windows Terminal is well-supported |
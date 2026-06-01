# CLAUDE.md — Agent Operating Manual for OpenCLI Project

> This file is the **primary instruction set** for any AI agent (Claude Code, Cursor, or equivalent) working on this project. Read this file fully before taking any action.

---

## Project Identity

**Project Name:** OpenCLI  
**Tagline:** A unified, self-improving CLI agent optimized for open-source LLMs (DeepSeek, Qwen, Minimax, GLM, Kimi, Devstral, and more)  
**Language:** TypeScript (primary), Python (tooling/scripts)  
**License:** Apache 2.0  
**Architecture:** Async generator agent loop, multi-provider adapter, plugin/tool registry, persistent knowledge brain

---

## What This Project Is

OpenCLI is a terminal-native, all-in-one coding agent CLI that closes the feature gap between closed-source tools (Claude Code, Gemini CLI) and the open-source ecosystem. It is **not** a thin wrapper — it is a full agentic harness built ground-up with:

1. **Multi-model provider switching** at runtime (DeepSeek, Qwen, Minimax, GLM, Kimi, Mistral/Devstral, Ollama local, OpenAI-compatible endpoints)
2. **Self-improving knowledge brain** (SECOND-KNOWLEDGE-BRAIN.md) that grows via automated paper/doc crawling
3. **Context compression** optimized for open-source models with smaller context windows
4. **Gap features** missing from existing CLIs: smart token budgeting, model benchmarking, multi-agent sub-task routing, offline mode, cost tracking

---

## Core Principles for the Agent

### 1. Think Before Acting
Always read the relevant source file before editing. Do not assume file contents. Use `cat` or `read_file` to inspect before modifying.

### 2. Preserve the Knowledge Brain
The file `SECOND-KNOWLEDGE-BRAIN.md` is sacred. It is **append-only** except during explicit `knowledge:update` commands. Never delete or truncate existing entries. Always add new research at the top of the relevant section with a dated header.

### 3. Multi-Model Awareness
When implementing features, always consider how the feature behaves differently across model providers. DeepSeek and Qwen have different tool-calling schemas from OpenAI. Write adapter layers, not provider-specific code in core logic.

### 4. No Breaking Changes Without Migration
Any change to the core agent loop (`src/core/agent-loop.ts`), the provider adapter interface (`src/providers/base.ts`), or the tool registry (`src/tools/registry.ts`) **must** include a migration path or be versioned.

### 5. Test Before Commit
Run `npm test` and `npm run lint` before any commit. The CI will reject untested changes. For integration tests involving model calls, use the `--mock` flag.

### 6. Cost Awareness
Every LLM API call in this codebase must go through the `CostTracker` middleware. Never make a raw fetch to a model API without attaching cost metadata.

---

## Directory Structure

```
opencli/
├── CLAUDE.md                        # This file — agent instructions
├── PROJECT-detail.md                # Full architecture & design spec
├── PROJECT-DEVELOPMENT-PHASE-TRACKING.md  # Sprint/milestone tracker
├── SECOND-KNOWLEDGE-BRAIN.md        # Self-updating knowledge corpus
│
├── src/
│   ├── main.ts                      # CLI entry point (commander.js)
│   ├── core/
│   │   ├── agent-loop.ts            # Async generator agent loop (core)
│   │   ├── session.ts               # Session state management
│   │   ├── planner.ts               # Multi-step task planner
│   │   └── compressor.ts            # Context compression engine
│   ├── providers/
│   │   ├── base.ts                  # Abstract provider interface
│   │   ├── deepseek.ts
│   │   ├── qwen.ts
│   │   ├── minimax.ts
│   │   ├── glm.ts
│   │   ├── kimi.ts
│   │   ├── devstral.ts
│   │   ├── ollama.ts                # Local model support
│   │   └── openai-compat.ts         # Generic OpenAI-compatible endpoint
│   ├── tools/
│   │   ├── registry.ts              # Tool registration & dispatch
│   │   ├── bash.ts                  # Shell execution tool
│   │   ├── file-read.ts
│   │   ├── file-write.ts
│   │   ├── file-edit.ts             # Diff-based surgical editing
│   │   ├── web-search.ts
│   │   ├── git.ts
│   │   └── mcp-bridge.ts            # MCP protocol bridge
│   ├── memory/
│   │   ├── session-memory.ts        # In-session episodic memory
│   │   ├── persistent-memory.ts     # Cross-session persistent store
│   │   └── knowledge-brain.ts       # Interface to SECOND-KNOWLEDGE-BRAIN.md
│   ├── knowledge/
│   │   ├── crawler.ts               # Research paper/doc crawler
│   │   ├── parser.ts                # Extract key insights from papers
│   │   ├── embedder.ts              # Semantic indexing of knowledge entries
│   │   └── updater.ts               # Scheduler for periodic knowledge updates
│   ├── ui/
│   │   ├── renderer.tsx             # Ink (React-for-terminal) root
│   │   ├── components/
│   │   │   ├── Spinner.tsx
│   │   │   ├── CostMeter.tsx
│   │   │   ├── ModelBadge.tsx
│   │   │   └── DiffViewer.tsx
│   │   └── theme.ts
│   ├── cost/
│   │   ├── tracker.ts               # Per-session token & cost tracking
│   │   └── budget.ts                # Max-spend limits & warnings
│   └── utils/
│       ├── config.ts                # Config file loading (~/.opencli/config.yml)
│       ├── logger.ts
│       └── diff.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── crawl-knowledge.ts           # Manual trigger for knowledge crawl
│   ├── benchmark-models.ts          # Run benchmark suite across providers
│   └── migrate-config.ts
│
└── docs/
    ├── architecture.md
    ├── provider-setup.md
    └── contributing.md
```

---

## Key Commands the Agent Should Know

```bash
# Development
npm run dev          # Run CLI in dev mode (hot reload)
npm run build        # Compile TypeScript
npm test             # Unit + integration tests
npm run lint         # ESLint + Prettier check
npm run typecheck    # tsc --noEmit

# Knowledge Brain
npm run knowledge:crawl    # Manually trigger paper/doc crawl
npm run knowledge:index    # Re-index the knowledge brain embeddings

# Benchmarking
npm run benchmark          # Run model comparison suite

# Config
opencli config set provider deepseek
opencli config set provider qwen
opencli config set model deepseek-v3
opencli config list
```

---

## Provider Configuration Pattern

All providers implement the `ModelProvider` interface:

```typescript
interface ModelProvider {
  id: string;
  name: string;
  models: ModelDescriptor[];
  chat(messages: Message[], options: ChatOptions): AsyncGenerator<Delta>;
  countTokens(messages: Message[]): Promise<number>;
  supportsMCP(): boolean;
  supportsTools(): boolean;
  maxContextWindow(): number;
}
```

When adding a new provider, always:
1. Implement `ModelProvider` in `src/providers/<name>.ts`
2. Register in `src/providers/registry.ts`
3. Add cost table entry in `src/cost/rates.ts`
4. Write integration test in `tests/integration/providers/<name>.test.ts`
5. Add to provider setup docs in `docs/provider-setup.md`

---

## Knowledge Brain Rules

The `SECOND-KNOWLEDGE-BRAIN.md` file follows this append format:

```markdown
## [CATEGORY] — Updated: YYYY-MM-DD

### Paper/Doc Title (Source URL)
**Key Insight:** One-sentence distillation
**Relevance:** How this applies to OpenCLI
**Applied In:** src/module/file.ts (if already implemented)

---
```

Categories: `CONTEXT-COMPRESSION`, `MULTI-AGENT`, `TOOL-USE`, `MEMORY-SYSTEMS`, `OPEN-SOURCE-MODELS`, `CLI-ARCHITECTURE`, `BENCHMARKS`

---

## Forbidden Actions

- **Never** delete `SECOND-KNOWLEDGE-BRAIN.md` entries
- **Never** hardcode API keys in source files
- **Never** make model API calls outside of the provider adapter layer
- **Never** use `any` TypeScript type in core modules (allowed in test fixtures)
- **Never** merge to `main` branch without passing CI
- **Never** add a new UI component without checking `src/ui/theme.ts` for existing tokens

---

## When in Doubt

1. Read the relevant section of `PROJECT-detail.md`
2. Check `SECOND-KNOWLEDGE-BRAIN.md` for research backing the decision
3. Check `PROJECT-DEVELOPMENT-PHASE-TRACKING.md` for current sprint priorities
4. If still unclear, write a comment block explaining the uncertainty and leave a `TODO(agent):` marker
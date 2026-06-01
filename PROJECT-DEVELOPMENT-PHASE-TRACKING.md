# PROJECT-DEVELOPMENT-PHASE-TRACKING.md — OpenCLI

> Live development tracker. Update this file at the start/end of each sprint. Agents should read this before beginning any work session to understand current priorities.

---

## Project Status: 🟡 Pre-Development (Specification Complete)

**Current Phase:** Phase 0 — Foundation Setup  
**Started:** 2026-05-31  
**Next Milestone:** Phase 1 Complete (MVP Core Loop)  
**Target MVP:** 2026-08-15

---

## Phase Overview

```
Phase 0: Foundation Setup          [IN PROGRESS] ████░░░░░░ 40%
Phase 1: Core Agent Loop + 2 Providers  [PLANNED]  ░░░░░░░░░░  0%
Phase 2: Provider Expansion (8 providers)   [PLANNED]  ░░░░░░░░░░  0%
Phase 3: Context Compression Engine  [PLANNED]  ░░░░░░░░░░  0%
Phase 4: Knowledge Brain System     [PLANNED]  ░░░░░░░░░░  0%
Phase 5: Terminal UI (Ink)          [PLANNED]  ░░░░░░░░░░  0%
Phase 6: Cost Tracking + Budget     [PLANNED]  ░░░░░░░░░░  0%
Phase 7: Multi-Agent Router         [PLANNED]  ░░░░░░░░░░  0%
Phase 8: MCP Bridge + Tools         [PLANNED]  ░░░░░░░░░░  0%
Phase 9: Beta + Community Release   [PLANNED]  ░░░░░░░░░░  0%
```

---

## PHASE 0 — Foundation Setup
**Duration:** Week 1 (2026-05-31 to 2026-06-07)  
**Goal:** Project skeleton, build system, CI, contributor tooling

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 0.1 | Initialize npm package, `tsconfig.json`, `eslint.config.ts` | ⬜ TODO | — | Use `"module": "nodenext"`, `"strict": true` |
| 0.2 | Set up Vitest for unit + integration tests | ⬜ TODO | — | Include mock fixture for providers |
| 0.3 | Set up GitHub Actions CI (build → lint → test) | ⬜ TODO | — | Run on push to main + all PRs |
| 0.4 | Create directory skeleton per `CLAUDE.md` spec | ⬜ TODO | — | All dirs, empty index files |
| 0.5 | Create `src/utils/config.ts` with cosmiconfig loader | ⬜ TODO | — | Read `~/.opencli/config.yml` |
| 0.6 | Create `src/utils/logger.ts` with log levels | ⬜ TODO | — | Silent in tests, verbose with `--debug` |
| 0.7 | Define all TypeScript interfaces in `src/types/` | ⬜ TODO | — | `ModelProvider`, `Message`, `ToolResult`, `AgentEvent`, `Session` |
| 0.8 | Write CONTRIBUTING.md and CODE_OF_CONDUCT.md | ⬜ TODO | — | Apache 2.0 license header requirements |
| 0.9 | Set up keytar for secure key storage | ⬜ TODO | — | Fallback to env vars if keytar unavailable |
| 0.10 | Create `docs/provider-setup.md` skeleton | ⬜ TODO | — | One section per provider |

**Phase 0 Exit Criteria:**
- [ ] `npm install && npm run build` succeeds with zero errors
- [ ] `npm test` runs and passes (even if only 1 placeholder test)
- [ ] CI passes on GitHub Actions
- [ ] All TypeScript interfaces defined and exported from `src/types/index.ts`

---

## PHASE 1 — Core Agent Loop + First 2 Providers
**Duration:** Weeks 2–3 (2026-06-08 to 2026-06-21)  
**Goal:** Working CLI that can complete a real coding task using DeepSeek and Qwen

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 1.1 | Implement `SessionManager` with message history | ⬜ TODO | — | Serialize to `~/.opencli/sessions/` |
| 1.2 | Implement async generator agent loop | ⬜ TODO | — | Per design in `PROJECT-detail.md §4.1` |
| 1.3 | Implement `ToolRegistry` with dispatch | ⬜ TODO | — | Register tools, validate schemas |
| 1.4 | Implement `BashTool` (with permission prompt) | ⬜ TODO | — | Show command before executing |
| 1.5 | Implement `FileReadTool`, `FileWriteTool`, `FileEditTool` | ⬜ TODO | — | EditTool uses diff-based patch |
| 1.6 | Implement `DeepSeekProvider` | ⬜ TODO | — | Handle thinking tokens in V3.2 |
| 1.7 | Implement `QwenProvider` | ⬜ TODO | — | `enable_thinking` flag, DashScope headers |
| 1.8 | Implement `CostTracker` basic version (log only) | ⬜ TODO | — | No UI yet, just log to file |
| 1.9 | Implement simple CLI entry point with Commander.js | ⬜ TODO | — | `opencli [task]`, `--provider`, `--model` flags |
| 1.10 | Write integration tests for DeepSeek + Qwen | ⬜ TODO | — | Use `--mock` flag to avoid real API calls |
| 1.11 | Manual end-to-end test: fix a real bug in a sample repo | ⬜ TODO | — | Document result in test fixtures |

**Phase 1 Exit Criteria:**
- [ ] `opencli "add error handling to main.py"` successfully modifies a file using DeepSeek
- [ ] `opencli -p qwen "explain this codebase"` works with Qwen provider
- [ ] Cost is logged per API call
- [ ] All unit + integration tests pass

---

## PHASE 2 — Provider Expansion (8 Providers)
**Duration:** Weeks 4–5 (2026-06-22 to 2026-07-05)  
**Goal:** Support all major open-source model providers

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 2.1 | Implement `MinimaxProvider` | ⬜ TODO | — | 1M context window; `abab` naming |
| 2.2 | Implement `GLMProvider` (Zhipu AI) | ⬜ TODO | — | Built-in web_search tool |
| 2.3 | Implement `KimiProvider` (Moonshot AI) | ⬜ TODO | — | Aggressive retry/backoff for rate limits |
| 2.4 | Implement `DevstralProvider` (Mistral) | ⬜ TODO | — | Image input support |
| 2.5 | Implement `OllamaProvider` (local) | ⬜ TODO | — | Auto-detect available models |
| 2.6 | Implement `OpenAICompatProvider` (generic shim) | ⬜ TODO | — | For any OAI-compatible endpoint |
| 2.7 | Implement `ProviderRegistry` (auto-detect from config) | ⬜ TODO | — | `opencli config set provider <name>` |
| 2.8 | Add cost rate tables for all providers (`src/cost/rates.ts`) | ⬜ TODO | — | Update from provider pricing pages |
| 2.9 | Implement `opencli setup` wizard | ⬜ TODO | — | Multi-select providers, API key entry, keytar storage |
| 2.10 | Implement `/model` and `/provider` slash commands | ⬜ TODO | — | Mid-conversation switching |
| 2.11 | Integration tests for all 8 providers (mocked) | ⬜ TODO | — | |

**Phase 2 Exit Criteria:**
- [ ] All 8 providers respond to a basic chat request in tests
- [ ] `opencli setup` wizard works end-to-end
- [ ] `opencli config list` shows configured providers and models
- [ ] Model switching works mid-session

---

## PHASE 3 — Context Compression Engine
**Duration:** Weeks 6–7 (2026-07-06 to 2026-07-19)  
**Goal:** Adaptive compression that prevents context overflow across all model types

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 3.1 | Implement token counter per provider (using tokenizer libs) | ⬜ TODO | — | `tiktoken` for OAI-compat; provider-specific for others |
| 3.2 | Implement sliding-window basic compression | ⬜ TODO | — | Keep recent N messages, always keep system prompt |
| 3.3 | Implement semantic compression (ACON-inspired) | ⬜ TODO | — | Compress old tool results into summaries |
| 3.4 | Implement `CompressionStrategy` per model config | ⬜ TODO | — | Per `PROJECT-detail.md §4.3` |
| 3.5 | Implement compression metrics (before/after token count) | ⬜ TODO | — | Log compression ratio per session |
| 3.6 | Add `/compress` slash command for manual trigger | ⬜ TODO | — | |
| 3.7 | Benchmark compression accuracy vs. task completion | ⬜ TODO | — | Use SWE-bench subset as test |
| 3.8 | Special handling for Devstral (32K — most aggressive) | ⬜ TODO | — | |

**Phase 3 Exit Criteria:**
- [ ] A 10,000-line codebase editing session stays within token limits for all providers
- [ ] Compression ratio logged; target: 30%+ reduction on long sessions
- [ ] Task completion rate not degraded vs. uncompressed baseline

---

## PHASE 4 — Knowledge Brain System
**Duration:** Weeks 8–9 (2026-07-20 to 2026-08-02)  
**Goal:** Self-improving knowledge corpus with automated paper crawling

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 4.1 | Implement arXiv crawler (`src/knowledge/crawler.ts`) | ⬜ TODO | — | Query cs.AI, cs.SE daily |
| 4.2 | Implement HuggingFace Papers crawler | ⬜ TODO | — | Track new model releases |
| 4.3 | Implement GitHub releases crawler (DeepSeek, Qwen, Minimax repos) | ⬜ TODO | — | Detect new model versions |
| 4.4 | Implement Papers With Code crawler (SWE-bench leaderboard) | ⬜ TODO | — | Track SOTA coding agent results |
| 4.5 | Implement LLM-based paper summarizer (`src/knowledge/parser.ts`) | ⬜ TODO | — | Use DeepSeek V2.5 Lite (cheap); extract key_insight + relevance |
| 4.6 | Implement local embedder (`@xenova/transformers`) | ⬜ TODO | — | No API cost; runs locally |
| 4.7 | Implement HNSW vector index (`hnswlib-node`) | ⬜ TODO | — | Store at `~/.opencli/knowledge-index/` |
| 4.8 | Implement `SECOND-KNOWLEDGE-BRAIN.md` append writer | ⬜ TODO | — | Follow format spec in `CLAUDE.md` |
| 4.9 | Implement knowledge injection into system prompt at startup | ⬜ TODO | — | Top-5 most relevant entries for current task |
| 4.10 | Implement `opencli knowledge crawl` manual trigger | ⬜ TODO | — | |
| 4.11 | Implement `opencli knowledge search "<query>"` | ⬜ TODO | — | Semantic search the index |
| 4.12 | Set up nightly cron job via npm postinstall | ⬜ TODO | — | Add to user crontab with permission |

**Phase 4 Exit Criteria:**
- [ ] Running `opencli knowledge crawl` adds at least 5 new entries to `SECOND-KNOWLEDGE-BRAIN.md`
- [ ] Relevant knowledge entries appear in agent's system prompt for a coding task
- [ ] Knowledge search returns semantically relevant results
- [ ] Nightly auto-crawl works (verified after 24h)

---

## PHASE 5 — Terminal UI (Ink)
**Duration:** Weeks 10–11 (2026-08-03 to 2026-08-09)  
**Goal:** Polished, informative terminal interface

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 5.1 | Set up Ink renderer as main UI layer | ⬜ TODO | — | Replace current stdout logging |
| 5.2 | Implement `<CostMeter />` component | ⬜ TODO | — | Token count + USD live update |
| 5.3 | Implement `<ModelBadge />` component | ⬜ TODO | — | Provider + model name top-right |
| 5.4 | Implement `<ThinkingSpinner />` | ⬜ TODO | — | Animated during model inference |
| 5.5 | Implement `<DiffViewer />` with approve/reject | ⬜ TODO | — | Color-coded, keyboard-navigable |
| 5.6 | Implement `<BudgetBar />` progress indicator | ⬜ TODO | — | Red at 80% budget used |
| 5.7 | Implement `<KnowledgePulse />` subtle indicator | ⬜ TODO | — | Show when knowledge brain was consulted |
| 5.8 | Implement `--no-ui` plain-text fallback mode | ⬜ TODO | — | For CI environments, Windows compatibility |
| 5.9 | Implement interactive permission prompt for bash/file-write | ⬜ TODO | — | Y/n with full command shown |
| 5.10 | Implement streaming text rendering (delta by delta) | ⬜ TODO | — | No buffering; instant feedback |

**Phase 5 Exit Criteria:**
- [ ] Full session visible in polished Ink UI
- [ ] Cost shown live during inference
- [ ] Diff viewer works with keyboard navigation
- [ ] `--no-ui` mode produces clean plain output suitable for piping

---

## PHASE 6 — Cost Tracking + Budget System
**Duration:** Week 12 (2026-08-10 to 2026-08-12)  
**Goal:** Production-grade cost awareness and protection

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 6.1 | Complete `CostTracker` with rolling period totals | ⬜ TODO | — | Daily, weekly, monthly |
| 6.2 | Implement `BudgetGuard` middleware | ⬜ TODO | — | Warn at 80%, block at 100% |
| 6.3 | Implement `opencli --cost` dashboard | ⬜ TODO | — | Table: per-provider, per-day costs |
| 6.4 | Implement cost export to CSV | ⬜ TODO | — | `opencli cost export --format csv` |
| 6.5 | Add `--ignore-budget` override with confirmation prompt | ⬜ TODO | — | Requires explicit "yes I understand" |
| 6.6 | Rate table auto-update via knowledge crawler | ⬜ TODO | — | Pricing pages crawled weekly |

---

## PHASE 7 — Multi-Agent Task Router
**Duration:** Weeks 13–14 (2026-08-13 to 2026-08-22)  
**Goal:** Intelligent task decomposition across specialized models

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 7.1 | Implement task decomposer (LLM-based planner) | ⬜ TODO | — | Use cheap model to plan subtasks |
| 7.2 | Implement subtask classifier (code/text/search/test) | ⬜ TODO | — | Rule-based + LLM hybrid |
| 7.3 | Implement model selector per subtask type | ⬜ TODO | — | Config: preferred model per task type |
| 7.4 | Implement orchestrator agent (coordinates sub-agents) | ⬜ TODO | — | Lightweight, uses GLM-4-Flash by default |
| 7.5 | Implement result merger | ⬜ TODO | — | Combine sub-agent outputs coherently |
| 7.6 | Implement `/multiagent` toggle slash command | ⬜ TODO | — | |
| 7.7 | Benchmark multi-agent vs. single-agent on SWE-bench subset | ⬜ TODO | — | Cost + quality comparison |

---

## PHASE 8 — MCP Bridge + Advanced Tools
**Duration:** Weeks 15–16 (2026-08-23 to 2026-09-05)  
**Goal:** Full MCP protocol compatibility + advanced toolset

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 8.1 | Implement MCP client bridge (`src/tools/mcp-bridge.ts`) | ⬜ TODO | — | Support stdio + HTTP MCP transports |
| 8.2 | Implement `opencli mcp add <url>` command | ⬜ TODO | — | Compatible with Claude Code MCP format |
| 8.3 | Implement `WebSearchTool` | ⬜ TODO | — | Via Brave/Serper API |
| 8.4 | Implement `GitTool` (commit, diff, log, branch) | ⬜ TODO | — | |
| 8.5 | Implement `--sandbox` Docker execution mode | ⬜ TODO | — | bash tool runs in container |
| 8.6 | Implement Configuration Profiles | ⬜ TODO | — | `opencli profile use <name>` |
| 8.7 | Implement audit log (`~/.opencli/audit.log`) | ⬜ TODO | — | All tool calls with timestamps |
| 8.8 | Implement `opencli benchmark` command | ⬜ TODO | — | Compare models on user's actual task |

---

## PHASE 9 — Beta Release & Community
**Duration:** Weeks 17–18 (2026-09-06 to 2026-09-20)  
**Goal:** Public beta, documentation, community infrastructure

### Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| 9.1 | Complete `docs/architecture.md` | ⬜ TODO | — | With diagrams |
| 9.2 | Complete `docs/provider-setup.md` | ⬜ TODO | — | Step-by-step per provider |
| 9.3 | Set up project website (opencli.dev) | ⬜ TODO | — | Simple static site with docs |
| 9.4 | Publish to npm registry | ⬜ TODO | — | `npm publish --access public` |
| 9.5 | Set up GitHub Discussions for community | ⬜ TODO | — | |
| 9.6 | Write launch blog post | ⬜ TODO | — | Hacker News, Dev.to, Reddit r/LocalLLaMA |
| 9.7 | Set up GitHub Sponsors | ⬜ TODO | — | |
| 9.8 | Record demo video | ⬜ TODO | — | Benchmark vs. Claude Code + Qwen-Code |

---

## Bug Tracker

| ID | Description | Severity | Phase | Status |
|---|---|---|---|---|
| — | No bugs yet (pre-development) | — | — | — |

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| 2026-05-31 | TypeScript over Python for core | Matches Claude Code/Qwen-Code ecosystem; npm distribution simpler; Ink requires JS | Python (Aider precedent, but CLI distribution harder) |
| 2026-05-31 | Apache 2.0 license | Matches Qwen-Code; permissive for enterprise adoption; compatible with Devstral's Apache 2.0 | MIT (too permissive for patent provisions), GPL (too restrictive) |
| 2026-05-31 | HNSW local vector index over SQLite-vec or Chroma | No external service dependency; works offline; fast ANN search | Chroma (requires server), pgvector (requires Postgres), SQLite-vec (slower) |
| 2026-05-31 | Ink (React for terminal) for UI | Matches Claude Code architecture; enables reusable components; streaming-friendly | Blessed (no longer maintained), chalk+process.stdout (too manual) |
| 2026-05-31 | Nightly arXiv crawl using cheap LLM for summarization | Keeps knowledge brain updated with minimal cost (~$0.01/day at DeepSeek V2.5 Lite pricing) | Manual curation (too slow), GPT-4 summarization (too expensive) |

---

## Performance Targets

| Metric | Target | Current |
|---|---|---|
| Time to first token | < 2s for cloud providers | TBD |
| Context compression ratio | > 30% for sessions > 50K tokens | TBD |
| Knowledge search latency | < 100ms (local HNSW) | TBD |
| CLI startup time | < 500ms | TBD |
| Multi-agent overhead vs single-agent | < 20% extra time | TBD |
| SWE-bench Verified score (with Kimi K2.6) | > 55% | TBD |

---

## Changelog

### v0.1.0 (2026-05-31) — Specification
- Created CLAUDE.md, PROJECT-detail.md, PROJECT-DEVELOPMENT-PHASE-TRACKING.md
- Created SECOND-KNOWLEDGE-BRAIN.md with initial research corpus
- Defined full architecture, provider list, gap features
- Phase 0 tasks defined
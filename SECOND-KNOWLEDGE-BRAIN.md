# SECOND-KNOWLEDGE-BRAIN.md — OpenCLI Living Knowledge Corpus

> **APPEND-ONLY FILE.** New entries go at the TOP of each section with a dated header.  
> This file is automatically updated nightly by the knowledge crawler (`src/knowledge/crawler.ts`).  
> It is also injected (semantically filtered) into the agent's system prompt at the start of each session.  
> **Do not delete or modify existing entries.** The history of knowledge accumulation is itself valuable.

---

## How This File Works

At agent startup, `src/memory/knowledge-brain.ts` reads this file, queries the HNSW embedding index at `~/.opencli/knowledge-index/`, and retrieves the top-5 entries most semantically similar to the current user task. Those entries are prepended to the system prompt, giving the agent accumulated research-backed wisdom relevant to the task at hand.

Over time, as the crawler adds more entries, the agent becomes progressively smarter, more accurate, and better tuned to the current state-of-the-art — without any manual intervention.

**Entry Format:**
```
## [CATEGORY] — Updated: YYYY-MM-DD

### [Title] (Source: URL)
**Key Insight:** One-sentence distillation of the finding
**Relevance to OpenCLI:** How this directly applies to our codebase or design decisions
**Applied In:** src/path/to/file.ts (fill in once implemented; leave blank if not yet)
**Tags:** comma-separated tags for filtering

---
```

**Categories:**
- `CONTEXT-COMPRESSION` — techniques for reducing token usage while preserving task continuity
- `MULTI-AGENT` — orchestration patterns, sub-task routing, agent coordination
- `TOOL-USE` — function calling, tool reliability, schema design
- `MEMORY-SYSTEMS` — episodic, semantic, persistent memory for agents
- `OPEN-SOURCE-MODELS` — capabilities, benchmarks, quirks of specific open-weight models
- `CLI-ARCHITECTURE` — terminal agent design patterns, UX, loop design
- `BENCHMARKS` — evaluation results relevant to our model selection decisions
- `PROVIDER-SPECIFICS` — quirks, optimizations, API details per provider

---

## [CLI-ARCHITECTURE] — Updated: 2026-05-31

### Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems (Source: https://arxiv.org/html/2604.14228v1)
**Key Insight:** The same recurring design questions (safety evaluation, extension mechanisms, memory scope) produce different architectural answers depending on whether the deployment context is a per-user CLI, a multi-channel gateway, or a multi-deployment messaging agent.
**Relevance to OpenCLI:** Validates our per-action approval model for bash/file-write tools, and our choice of context-window extensions (knowledge injection) over registry-managed capabilities. The paper identifies six open design directions: OpenCLI should track these as potential future phases.
**Applied In:** src/core/agent-loop.ts (permission prompt design), src/tools/registry.ts
**Tags:** architecture, agent-loop, permission-model, extension-mechanism

---

### Claude Code Source Architecture Analysis (Source: https://github.com/chauncygu/collection-claude-code-source-code)
**Key Insight:** Claude Code's core is an async generator agent loop in ~1,884 TypeScript files; the key innovation is treating tool results as first-class conversation messages that feed back into the generator, enabling self-correcting behavior.
**Relevance to OpenCLI:** Direct architectural blueprint. Our `agentLoop` async generator design follows this pattern. Tool results appended as `tool_result` messages allow the model to observe its own actions and correct course.
**Applied In:** src/core/agent-loop.ts
**Tags:** architecture, async-generator, tool-calling, claude-code

---

### Open-Claude-Code: Clean-Room Rebuild (Source: https://github.com/ruvnet/open-claude-code)
**Key Insight:** A 61-file, 8,314-line clean-room implementation proves Claude Code's architecture is reproducible with 1,581 tests; key components are: 25 tools, 4 MCP transports, 6 permission modes, hooks system, settings chain.
**Relevance to OpenCLI:** Confirms our tool count target (~20 core tools) is realistic. Their MCP transport implementations (stdio + HTTP) are reference material for our `mcp-bridge.ts`. Permission mode taxonomy: auto, ask, manual, restricted, bypassPermissions, defaultDenyOnError.
**Applied In:** src/tools/mcp-bridge.ts (reference), src/core/session.ts
**Tags:** architecture, MCP, permission-modes, tools

---

## [CONTEXT-COMPRESSION] — Updated: 2026-05-31

### ACON: Optimizing Context Compression for Long-horizon LLM Agents (Source: https://arxiv.org/pdf/2510.00615)
**Key Insight:** ACON's episodic context reconstruction (where assistant sub-agents maintain uncompressed local context while a master agent orchestrates global planning) reduces peak token usage by 26-54% while maintaining 95%+ task performance, with small LMs improving by 20-46% on agent benchmarks.
**Relevance to OpenCLI:** Direct implementation target for our compression engine. The key innovation — compress *via reconstruction* rather than deletion — should be our primary strategy for sessions exceeding 60% of context window. Also validates our multi-agent architecture: sub-agents with local context + orchestrator mirrors ACON's design.
**Applied In:** src/core/compressor.ts (target), src/core/planner.ts (multi-agent mirrors this)
**Tags:** context-compression, memory, multi-agent, ACON, episodic-reconstruction

---

### SWE-Pruner: Self-Adaptive Context Pruning for Coding Agents (Source: https://arxiv.org/pdf/2601.16746)
**Key Insight:** The critical bottleneck for coding agents is context length accumulation; SWE-Pruner addresses this with task-specific pruning using OpenTelemetry-traced execution to identify and remove context segments that don't contribute to the current coding sub-task.
**Relevance to OpenCLI:** Informs our `CompressionStrategy.pruningMode = 'adaptive'` setting. For coding tasks specifically, we should implement SWE-Pruner's approach: identify which file segments and tool results are actively referenced by the current plan step, prune the rest.
**Applied In:** src/core/compressor.ts (target)
**Tags:** context-compression, coding-agents, SWE-Pruner, pruning, coding

---

### E-mem: Multi-agent based Episodic Context Reconstruction for LLM Agent Memory (Source: https://github.com/VoltAgent/awesome-ai-agent-papers)
**Key Insight:** Replacing destructive memory compression with episodic reconstruction — where context is rebuilt from structured episodic summaries rather than truncated — improves agent performance on long-horizon tasks by preserving the reasoning chain.
**Relevance to OpenCLI:** The `SessionMemory` class should store not just raw messages but episodic summaries keyed by task step. When context must be compressed, reconstruct from summaries rather than simply dropping old messages.
**Applied In:** src/memory/session-memory.ts (target)
**Tags:** memory, episodic-reconstruction, context-compression, long-horizon

---

## [OPEN-SOURCE-MODELS] — Updated: 2026-05-31

### Kimi K2.6 — LiveBench May 2026 Leader (Source: https://pinggy.io/blog/best_open_source_self_hosted_llms_for_coding/)
**Key Insight:** Kimi K2.6 currently leads open-source models on both Coding (78.57) and Agentic Coding (58.33) on the May 12, 2026 LiveBench snapshot, with GLM 5.1 and DeepSeek V4 Pro close behind on agentic work.
**Relevance to OpenCLI:** Kimi K2.6 should be our default recommendation for agentic coding tasks in the multi-agent router. When routing a "code-heavy" subtask, prefer Kimi K2.6 if the user has it configured.
**Applied In:** src/core/planner.ts (model selection), docs/provider-setup.md
**Tags:** kimi, benchmarks, agentic-coding, model-selection, LiveBench

---

### DeepSeek-V3.2: "Thinking in Tool-Use" Architecture (Source: https://fireworks.ai/blog/best-open-source-llms)
**Key Insight:** DeepSeek-V3.2 retains its chain-of-thought reasoning trace throughout tool calls (unlike predecessors that discard it), enabling more coherent multi-step tool-using agents; DSA (DeepSeek Sparse Attention) cuts memory by up to 3x for long-context scenarios.
**Relevance to OpenCLI:** Our `DeepSeekProvider` must pass `retain_chain_of_thought=true` for V3.2 and handle the reasoning tokens separately from the response content. DSA means DeepSeek V3.2 is our best option for long-context agentic sessions under cost pressure.
**Applied In:** src/providers/deepseek.ts (target)
**Tags:** deepseek, v3.2, chain-of-thought, tool-use, sparse-attention

---

### Qwen3-Coder: 256K Native Context, 1M with Extrapolation (Source: https://rits.shanghai.nyu.edu/ai/introducing-qwen-code-alibabas-open-source-cli-for-agentic-coding-with-qwen3-coder/)
**Key Insight:** Qwen3-Coder (480B MoE, 35B active) rivals GPT-4o and Claude Sonnet on terminal benchmarks, supports 256K token context natively (1M with extrapolation), and is Apache 2.0 licensed; Qwen-Code (its official CLI) forked from Gemini CLI.
**Relevance to OpenCLI:** Qwen3-Coder is our primary target for large codebase tasks (up to 256K context). The `enable_thinking` parameter enables hybrid fast/slow reasoning — use it for complex architectural tasks, disable for simple completions to save tokens.
**Applied In:** src/providers/qwen.ts (target)
**Tags:** qwen, qwen3-coder, context-window, enable_thinking, MoE

---

### Devstral Small 2: 24B Params, Single GPU, Apache 2.0 (Source: https://pinggy.io/blog/best_open_source_self_hosted_llms_for_coding/)
**Key Insight:** Devstral Small 2 achieves 68% on SWE-bench Verified (remarkable for a single-RTX-4090 model), supports image inputs, and is the most permissively licensed competitive coding model (Apache 2.0); 7x more cost-efficient than Claude Sonnet.
**Relevance to OpenCLI:** Our primary recommendation for users with a single GPU who want offline/local agentic coding. Context window of 32K means aggressive compression is needed — Devstral sessions should trigger compression at 50% usage rather than 80%.
**Applied In:** src/providers/devstral.ts (target), src/core/compressor.ts (special handling)
**Tags:** devstral, mistral, local, offline, apache2, single-gpu

---

### GLM-5.1 (Zhipu AI) — Built-in Web Search (Source: https://huggingface.co/blog/daya-shankar/open-source-llms)
**Key Insight:** GLM-5.1 is competitive on agentic coding in LiveBench May 2026 and has a unique built-in web_search tool that requires no external MCP server — the model routes search queries natively via the API.
**Relevance to OpenCLI:** When using GLM provider, disable our external `WebSearchTool` and instead use GLM's native search capability. This is provider-specific optimization logic that should live in the `GLMProvider` adapter.
**Applied In:** src/providers/glm.ts (target)
**Tags:** glm, zhipu, web-search, built-in-tools, provider-specific

---

### Minimax-01: 1M Token Context Window (Source: https://huggingface.co/blog/daya-shankar/open-source-llms)
**Key Insight:** Minimax-01 offers the largest context window (1M tokens) among competitive open-source models, using a hybrid Mamba-Transformer architecture that maintains linear complexity at long contexts.
**Relevance to OpenCLI:** Minimax is the optimal provider for tasks involving entire large repositories or extremely long documents. Our compression engine should have a "skip compression" mode for Minimax since the context budget is rarely approached.
**Applied In:** src/providers/minimax.ts (target), src/core/compressor.ts (skip threshold)
**Tags:** minimax, 1M-context, mamba, long-context

---

## [MULTI-AGENT] — Updated: 2026-05-31

### O-Researcher: Multi-Agent Distillation + Agentic RL for Research (Source: https://github.com/VoltAgent/awesome-ai-agent-papers)
**Key Insight:** A multi-agent workflow for synthesizing research-grade training data with a two-stage SFT plus agentic RL strategy enables open-source models to achieve deep research quality without frontier model training budgets.
**Relevance to OpenCLI:** The "distillation coordinator + specialist agents" pattern directly maps to our multi-agent router. The agentic RL approach suggests future optimization: reward the orchestrator for choosing models that maximize quality/cost ratio on specific task types.
**Applied In:** src/core/planner.ts (future optimization)
**Tags:** multi-agent, orchestration, distillation, agentic-RL

---

### Transitive Expert Error in Multi-Model Orchestration (Source: https://github.com/VoltAgent/awesome-ai-agent-papers)
**Key Insight:** In multi-model routing systems, errors propagate transitively through the orchestration chain — a wrong routing decision amplifies downstream errors; boundary-aware calibration and coverage gap detection can mitigate this.
**Relevance to OpenCLI:** Our orchestrator agent must include error containment: if a sub-agent fails, it should not silently propagate bad output to the merger. Implement a `SubTaskResult.confidence` score; below threshold, re-route to a different model.
**Applied In:** src/core/planner.ts (target — confidence scoring)
**Tags:** multi-agent, error-propagation, routing, robustness

---

## [TOOL-USE] — Updated: 2026-05-31

### XGrammar 2: Dynamic Structured Generation for Agentic LLMs (Source: https://github.com/VoltAgent/awesome-ai-agent-papers)
**Key Insight:** Dynamic tag dispatching, JIT compilation, and cross-grammar caching for tool calling enables structured generation engines to handle complex conditional tool schemas at production speeds.
**Relevance to OpenCLI:** When implementing tool schema validation, use cached grammar compilation rather than re-parsing schemas on every tool call. This is especially important for providers (Qwen, GLM) that don't natively validate tool schemas server-side.
**Applied In:** src/tools/registry.ts (target — schema caching)
**Tags:** tool-use, structured-generation, schema-validation, performance

---

### Automated Structural Testing of LLM-Based Agents (Source: https://github.com/VoltAgent/awesome-ai-agent-papers)
**Key Insight:** Using OpenTelemetry traces with mocking for reproducible agent behavior and automated assertions for component-level verification enables robust structural testing without expensive real API calls.
**Relevance to OpenCLI:** Our test suite should use OpenTelemetry-style tracing of agent loop events, with mock provider responses generated from recorded real interactions. This is how `--mock` mode should work for integration tests.
**Applied In:** tests/integration/ (target — trace-based testing)
**Tags:** testing, OpenTelemetry, mocking, agent-testing

---

## [BENCHMARKS] — Updated: 2026-05-31

### LiveBench May 2026 Snapshot — Open-Source Coding Rankings (Source: https://pinggy.io/blog/best_open_source_self_hosted_llms_for_coding/)
**Key Insight:** LiveBench May 12, 2026: Kimi K2.6 Thinking leads (Coding: 78.57, Agentic: 58.33), followed by GLM 5.1 and DeepSeek V4 Pro on agentic work; Qwen 3.6 27B is the best local-deployment option balancing capability and hardware requirements.
**Relevance to OpenCLI:** Model selection defaults in our `planner.ts` should reflect this ranking. The benchmark is contamination-resistant (crucial for trustworthiness). Update this entry whenever LiveBench publishes a new snapshot.
**Applied In:** src/core/planner.ts (default model routing), docs/provider-setup.md
**Tags:** benchmarks, LiveBench, model-ranking, 2026

---

### SWE-bench Verified — Devstral Small 2 Achievement (Source: https://pinggy.io/blog/best_open_source_self_hosted_llms_for_coding/)
**Key Insight:** Devstral Small 2 achieves 68% on SWE-bench Verified — the industry-standard coding agent evaluation — making it the most capable single-GPU deployable model for real-world software engineering tasks.
**Relevance to OpenCLI:** Use SWE-bench Verified (not SWE-bench full) as our internal benchmark for regression testing model integrations. A provider integration is "production-ready" when it achieves >50% on our SWE-bench subset.
**Applied In:** scripts/benchmark-models.ts (target)
**Tags:** benchmarks, SWE-bench, devstral, evaluation

---

## [CLI-ARCHITECTURE] — Provider & Ecosystem Notes

### Qwen-Code Ecosystem Update (Source: https://github.com/QwenLM/qwen-code)
**Key Insight:** As of April 2026, Qwen's free OAuth tier was discontinued; users must use Alibaba Cloud Coding Plan, OpenRouter, Fireworks AI, or BYOK. Qwen-Code supports multi-protocol providers (OpenAI / Anthropic / Gemini-compatible APIs).
**Relevance to OpenCLI:** Our `QwenProvider` must support all four endpoint types. The multi-protocol approach validates our own `OpenAICompatProvider` generic shim. Users migrating from Qwen-Code should be able to reuse their existing BYOK setup.
**Applied In:** src/providers/qwen.ts, docs/provider-setup.md
**Tags:** qwen, qwen-code, BYOK, OpenRouter, Fireworks

---

### Open-Source CLI Ecosystem Trend 2026 (Source: https://dev.to/lightningdev123/best-open-source-cli-coding-agents-to-explore-in-2026-5bn7)
**Key Insight:** The primary value proposition of open-source CLI harnesses in 2026 is model-harness separation — the same tool works with GPT, Claude, Qwen, DeepSeek, or local Ollama models, preventing vendor lock-in.
**Relevance to OpenCLI:** Our architecture directly embodies this: `ModelProvider` interface is the harness, providers are swappable. This should be the #1 messaging point in our README and launch blog post.
**Applied In:** src/providers/base.ts (core design principle)
**Tags:** ecosystem, vendor-lock-in, open-source, provider-agnostic

---

## Knowledge Brain Statistics

| Metric | Value |
|---|---|
| Total entries | 21 |
| Categories covered | 6 of 8 |
| Last manual crawl | 2026-05-31 |
| Last auto-crawl | Never (system not yet implemented) |
| Embedding index status | Not yet initialized |
| Oldest entry | 2026-05-31 |
| Average entries per crawl | N/A |

*Statistics updated automatically by `src/knowledge/updater.ts` after each crawl.*

---

## Crawler Configuration Reference

The knowledge crawler targets these sources in priority order:

```yaml
# ~/.opencli/knowledge-crawler.yml (auto-generated by setup)
sources:
  arxiv:
    queries:
      - "cs.AI coding agent terminal CLI"
      - "cs.SE LLM software engineering agent"
      - "cs.LG context compression agent memory"
      - "open source model agentic benchmark"
    max_results_per_query: 5
    cadence: daily
    
  huggingface_papers:
    topics: ["code-generation", "agents", "llm"]
    cadence: daily
    
  github_releases:
    repos:
      - deepseek-ai/DeepSeek-V3
      - QwenLM/Qwen2.5-Coder
      - QwenLM/qwen-code
      - MiniMaxAI/MiniMax-01
      - THUDM/GLM-4
      - moonshot-ai/kimi-k2
      - mistralai/Devstral
    cadence: daily
    
  papers_with_code:
    leaderboards:
      - swe-bench-verified
      - humaneval
      - livebench-coding
    cadence: weekly

summarizer:
  provider: deepseek
  model: deepseek-chat  # cheapest model for summarization
  max_tokens: 300
  prompt: |
    Extract from this paper/release:
    1. Key Insight (1 sentence)
    2. Relevance to an open-source coding CLI agent
    3. Tags (comma-separated)
    Format as JSON only.
```
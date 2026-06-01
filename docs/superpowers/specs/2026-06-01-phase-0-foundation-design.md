# Phase 0 Foundation Setup — Design Specification

**Date:** 2026-06-01
**Status:** Approved
**Author:** Claude Code
**Phase:** Foundation Setup

---

## Overview

Phase 0 establishes the production-ready foundation for OpenCLI — a multi-provider coding agent CLI. This layer contains all configuration, type definitions, utilities, and infrastructure that subsequent phases depend on.

**Goal:** Working build system with comprehensive configs, full CI, and all core interfaces defined.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Package Metadata                         │
│  package.json · tsconfig.json · eslint.config.ts            │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                    Directory Structure                        │
│  All folders per CLAUDE.md spec with empty index files       │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                      Core Types                               │
│  ModelProvider · Message · Tool · Session · AgentEvent         │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                      Utilities                                │
│  config.ts (cosmiconfig) · logger.ts (pino)                  │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                    Testing Foundation                         │
│  Vitest · mock fixtures · test configuration                  │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                      CI Pipeline                              │
│  GitHub Actions: build → lint → test                          │
└──────────────────────────┬──────────────────────────────────┘
                             │
┌───────────────────────────▼──────────────────────────────────┐
│                    Security & Docs                            │
│  keytar integration · CONTRIBUTING · provider-setup docs      │
└───────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Package Metadata

**Files:** `package.json`, `tsconfig.json`, `eslint.config.ts`

**Key Decisions:**
- ES modules (`"type": "module"`, `nodenext` resolution)
- Node 20+ minimum
- Balanced TypeScript strictness (`strict: true` with core flags)
- Declaration generation for library consumers

### 2. Directory Structure

**Layout:** Full OpenCLI structure with placeholder files for future phases

**Scope for Phase 0:**
- Populate: `types/index.ts`, `utils/config.ts`, `utils/logger.ts`
- Placeholders: All `core/`, `providers/`, `tools/`, `memory/` modules
- Empty for now: `knowledge/`, `ui/`, `cost/` (Phase 3+)

### 3. Core Types (`src/types/index.ts`)

**Interfaces:**
- `Message`, `ToolCall`, `ToolResult` — Conversation types
- `AgentEvent` — Streaming event types
- `ModelProvider` — Abstract base class for all providers
- `ChatOptions`, `Delta`, `ChatResponse` — Provider contract
- `ModelDescriptor` — Model metadata
- `Tool`, `ToolSchema` — Tool system contract
- `Session` — State management
- `CompressionStrategy` — Pre-defined for Phase 3

**Design Decisions:**
- `ModelProvider` as abstract class (allows default implementations)
- `AsyncGenerator<Delta>` for streaming (matches Claude Code)
- Tool schema matches OpenAI format (widely compatible)

### 4. Utilities

**config.ts:**
- Cosmiconfig for config discovery (`~/.opencli/config.yml`)
- Zod schema validation
- Default values for all settings
- Multiple providers support

**logger.ts:**
- Pino structured logging
- Silent in tests (`/dev/null`)
- Verbose with `DEBUG` env flag
- ISO timestamps, clean output

### 5. Testing Foundation

**Vitest configuration:**
- Node environment
- Coverage reporting (v8, text/json/html)
- Test setup for silent logging

**Mock fixtures:**
- `MockProvider` — Fake provider for integration tests
- Never calls real APIs
- Implements full `ModelProvider` interface

### 6. CI Pipeline

**GitHub Actions (.github/workflows/ci.yml):**
- Triggers: push to main, all PRs
- Steps: checkout → setup Node → npm ci → typecheck → lint → test
- Node version: 20 (with npm caching)

### 7. Security

**keytar integration (`src/utils/secure-storage.ts`):**
- Store API keys in OS keychain
- Provider-based keys (`opencli://deepseek`, `opencli://qwen`)
- Fallback to environment variables
- Helper: `getApiKeyOrEnv(provider, envVar)`

### 8. Documentation

**Files:**
- `CONTRIBUTING.md` — Apache 2.0 license headers, dev setup
- `CODE_OF_CONDUCT.md` — Contributor covenant
- `docs/provider-setup.md` — Section headers only (content in Phase 1+)

---

## Data Flow

```
User runs command
       │
       ▼
main.ts → loadConfig() → reads ~/.opencli/config.yml
       │
       ▼
Session created with selected provider
       │
       ▼
Agent loop (Phase 1) uses types defined now
       │
       ▼
All logs go through logger.ts
```

---

## Error Handling

**Config loading:**
- Invalid YAML → Error with file location
- Schema validation fail → Error with field path, continue with defaults
- Missing config → Use defaults

**Logger:**
- Test mode → Silent (`/dev/null`)
- Production → stdout/stderr based on level

**Keytar:**
- Unavailable → Graceful degradation to env vars
- Key not found → Return null (caller handles)

---

## Testing Strategy

**Unit tests:**
- `config.test.ts` — Config loading, validation, defaults
- `logger.test.ts` — Log levels, formatting
- `types/index.test.ts` — Interface smoke tests (type checking)

**Integration tests:**
- Mock provider validates `ModelProvider` contract
- Test fixtures use `--mock` flag

**Coverage target:**
- Phase 0: 80%+ on utils/types
- Future phases: Maintain 70%+ overall

---

## Dependencies

```json
{
  "dependencies": {
    "cosmiconfig": "^9.0.0",
    "pino": "^9.0.0",
    "zod": "^3.22.0",
    "keytar": "^7.9.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.55.0",
    "typescript-eslint": "^6.15.0",
    "prettier": "^3.1.0"
  }
}
```

---

## Exit Criteria

Phase 0 is complete when:
- ✅ `npm install && npm run build` succeeds with zero errors
- ✅ `npm test` runs and passes (placeholder tests count)
- ✅ CI passes on GitHub Actions
- ✅ All TypeScript interfaces defined in `src/types/index.ts`
- ✅ Config loads from `~/.opencli/config.yml`
- ✅ Logger silent in tests, verbose with DEBUG

---

## Next Phase

After Phase 0, Phase 1 implements:
- Core agent loop (async generator)
- Session manager
- Tool registry + bash/file tools
- First 2 providers (DeepSeek, Qwen)
- Cost tracker basic version
- CLI entry point

All will use the types, utilities, and infrastructure established here.

---

## Changes from Original Spec

None — this follows the approved Layered Foundation approach.

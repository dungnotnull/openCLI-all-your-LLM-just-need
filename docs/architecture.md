# OpenCLI Architecture

OpenCLI is a terminal-native, all-in-one coding agent CLI that bridges the feature gap between closed-source tools (Claude Code, Gemini CLI) and the open-source ecosystem.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                           │
│                    (Commander.js + Terminal UI)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Loop (Core)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Session Manager → Agent Loop → Tool Registry → Provider  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider Layer                                │
│  DeepSeek │ Qwen │ Minimax │ GLM │ Kimi │ Devstral │ Ollama    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Layer                                    │
│  Bash │ File Read/Write/Edit │ Git │ Web Search │ MCP Bridge   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Agent Loop (`src/core/agent-loop.ts`)

The heart of OpenCLI is an async generator-based agent loop that streams responses in real-time:

```typescript
async function* runAgentLoop(
  messages: Message[],
  provider: ModelProvider,
  tools: ToolRegistry
): AsyncGenerator<Delta> {
  // Compress context if needed
  const compressedMessages = await compressor.compress(messages);

  // Stream provider responses
  for await (const delta of provider.chat(compressedMessages, options)) {
    yield delta;

    // Handle tool calls
    if (delta.type === 'tool_call') {
      const result = await tools.execute(delta.tool);
      // Feed result back to provider
    }
  }
}
```

**Key Features:**
- Async generators for streaming responses
- Context compression before each provider call
- Tool execution with result feedback
- Budget enforcement at each iteration

### 2. Provider System (`src/providers/`)

OpenCLI supports 8+ model providers through a unified adapter interface:

```typescript
interface ModelProvider {
  id: string;
  name: string;
  models: ModelDescriptor[];

  async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<Delta>;

  countTokens(messages: Message[]): Promise<number>;
  maxContextWindow(): number;
  supportsTools(): boolean;
}
```

**Supported Providers:**
- **DeepSeek**: Cost-effective, strong coding capabilities
- **Qwen**: 256K context window, excellent for large codebases
- **Minimax**: 1M context window for massive files
- **GLM (Zhipu AI)**: Built-in web search capabilities
- **Kimi**: LiveBench leader, aggressive rate limit handling
- **Devstral (Mistral)**: Apache 2.0, image input support
- **Ollama**: Local model support
- **OpenAI-Compatible**: Generic endpoint support

### 3. Tool Registry (`src/tools/registry.ts`)

Centralized tool management with schema validation:

```typescript
class ToolRegistry {
  register(tool: Tool): void;
  execute(toolName: string, input: unknown): Promise<ToolResult>;
  getSchemas(): ToolSchema[];
}
```

**Available Tools:**
- `bash`: Execute shell commands (with Docker sandbox option)
- `file_read`, `file_write`, `file_edit`: File operations
- `git`: Git operations (commit, diff, log, branch)
- `web_search`: Web search via Brave/Serper APIs
- `mcp_bridge`: MCP protocol compatibility

### 4. Context Compression (`src/core/compressor.ts`)

Adaptive compression strategies to prevent context overflow:

```typescript
interface CompressionStrategy {
  type: 'sliding' | 'semantic' | 'adaptive';
  maxTokens: number;
  keepSystemPrompt: boolean;
}

class ContextCompressor {
  async compress(messages: Message[]): Promise<Message[]>;
}
```

**Strategies:**
- **Sliding Window**: Keep recent N messages
- **Semantic**: Compress old tool results into summaries
- **Adaptive**: Provider-specific optimization

### 5. Knowledge Brain (`src/knowledge/`)

Self-improving knowledge corpus with automated paper crawling:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Crawlers   │ → → │    Parser    │ → → │   Embedder   │
│ arXiv │ HF   │     │  LLM-based   │     │ Transformers  │
│ GitHub │ PwC │     │  Extraction  │     │   HNSW Store  │
└──────────────┘     ┌──────────────┘     └──────────────┘
                       │
                       ▼
                  SECOND-KNOWLEDGE-BRAIN.md
```

**Features:**
- Automated research paper crawling
- Semantic search via vector embeddings
- Knowledge injection into system prompts
- Nightly auto-update scheduling

### 6. Cost Tracking (`src/cost/`)

Production-grade cost awareness and budget enforcement:

```typescript
class EnhancedCostTracker {
  trackCall(provider, model, inputTokens, outputTokens, rates): void;
  getPeriodTotals(): { daily, weekly, monthly };
  exportToCSV(): string;
}

class BudgetGuard {
  wrapProvider(provider): BudgetGuardedProvider;
  checkBudget(additionalCost): { allowed, reason };
}
```

**Features:**
- Per-session and rolling period totals
- Budget limits with 80% warning
- Cost export to CSV/JSON
- Multi-provider cost comparison

### 7. Multi-Agent Router (`src/core/multi-agent.ts`)

Intelligent task decomposition across specialized models:

```
┌────────────────┐
│   User Task    │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Task Decomposer │ → Subtasks
└───────┬────────┘
        │
        ▼
┌────────────────┐
│Subtask Classifier│ → Types (code/text/search/test)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Model Selector │ → Assign optimal model per subtask
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Orchestrator   │ → Coordinate sub-agent execution
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Result Merger   │ → Combine coherent output
└────────────────┘
```

## Data Flow

### 1. User Command → Agent Execution

```
1. User runs: opencli "fix the authentication bug"
2. CLI parses command and loads configuration
3. Session Manager initializes or resumes session
4. Agent Loop starts with user message
5. Provider streams response deltas
6. UI renders streaming output
7. Tools execute as needed
8. Results feed back to provider
9. Final response displayed to user
10. Session state persisted
```

### 2. Tool Execution Flow

```
1. Provider requests tool call
2. Tool Registry validates input schema
3. Permission prompt shown to user
4. Tool executes (host or Docker sandbox)
5. Result captured and returned
6. Provider continues with tool result
```

### 3. Context Compression Flow

```
1. Before provider call, check token count
2. If exceeding threshold, apply compression
3. Sliding window removes old messages
4. Semantic compression summarizes tool results
5. System prompt always preserved
6. Compressed messages sent to provider
7. Compression ratio logged
```

## Configuration Management

### Config File Structure (~/.opencli/config.yml)

```yaml
# Provider Configuration
provider: deepseek
model: deepseek-v3

# Budget Settings
budget:
  limit: 10.0
  warn_percent: 0.8

# Compression Settings
compression:
  strategy: adaptive
  max_tokens: 8000

# Tool Settings
tools:
  sandbox: false
  permissions: required

# UI Settings
ui:
  enabled: true
  theme: default
```

### Profile System

Named configuration profiles for different use cases:

```bash
opencli profile use fast          # Quick responses
opencli profile use power         # Maximum capabilities
opencli profile use budget-conscious  # Cost-optimized
```

## Security Features

### 1. Docker Sandbox Mode

Bash commands can run in isolated Docker containers:

```typescript
// Enable sandbox mode
const bashTool = new BashTool(sandboxMode=true);
```

**Sandbox provides:**
- Filesystem isolation
- Network isolation
- Temporary container lifecycle
- No persistent changes

### 2. Permission Prompts

All tool executions require user confirmation:

```
[Tool: bash] Executing command:
  rm -rf node_modules
  (in directory: /workspace)

Execute this command? [Y/n]
```

### 3. Audit Logging

All operations logged to `~/.opencli/audit.log`:

```
[2025-01-09T10:30:00Z] [tool_call] bash {"command":"npm install"}
[2025-01-09T10:30:15Z] [provider_call] deepseek {"cost":0.0023}
```

## Extension Points

### 1. Adding a New Provider

```typescript
// 1. Create src/providers/newprovider.ts
export class NewProvider extends ModelProvider {
  // Implement required methods
}

// 2. Register in src/providers/registry.ts
export const providerRegistry = {
  newprovider: (await import("./newprovider.js")).NewProvider,
};
```

### 2. Adding a New Tool

```typescript
// 1. Create src/tools/newtool.ts
export class NewTool extends Tool {
  readonly name = 'new_tool';
  async execute(input): Promise<ToolResult> {
    // Tool logic
  }
}

// 2. Register in tool registry
registry.register(new NewTool());
```

### 3. MCP Protocol Integration

```bash
# Add MCP server
opencli mcp add https://example.com/mcp-server

# Use MCP tools in agent
opencli "use the filesystem tool from MCP server"
```

## Performance Considerations

### 1. Token Optimization

- Compression ratios > 30% on long sessions
- Provider-specific token counting
- Intelligent context window management

### 2. Cost Optimization

- Rolling period cost tracking
- Budget enforcement at 80%/100%
- Multi-provider cost comparison

### 3. Multi-Agent Overhead

- Subtask decomposition adds < 20% overhead
- Specialized models reduce overall cost
- Parallel subtask execution where possible

## Deployment

### Installation

```bash
npm install -g opencli
opencli setup  # Configure API keys
```

### Development

```bash
git clone https://github.com/open-cli/opencli
cd opencli
npm install
npm run build
npm link
```

### Docker Deployment

```bash
docker build -t opencli .
docker run -it opencli "fix the authentication bug"
```

## Architecture Decisions

### 1. TypeScript over Python

**Rationale:**
- Matches Claude Code/Qwen-Code ecosystem
- npm distribution simpler than PyPI
- Ink requires JavaScript runtime
- Better type safety for complex tool interactions

### 2. Async Generators for Streaming

**Rationale:**
- Real-time response streaming
- Memory efficiency for long sessions
- Natural fit for LLM APIs
- Enables progressive UI rendering

### 3. Provider Adapter Pattern

**Rationale:**
- Unified interface across providers
- Easy to add new providers
- Provider-specific optimizations
- Transparent model switching

### 4. Local Vector Store (HNSW)

**Rationale:**
- No external service dependency
- Works offline
- Fast ANN search
- Smaller deployment footprint

### 5. Nightly Knowledge Crawls

**Rationale:**
- Keeps knowledge brain current
- Minimal cost (~$0.01/day)
- Automated updates
- Reduces manual curation

## Future Directions

### 1. Enhanced Multi-Agent

- Parallel subtask execution
- Dynamic model selection
- Result caching
- Conflict resolution

### 2. Improved Knowledge Brain

- Real-time paper feeds
- Community knowledge sharing
- GitHub integration
- Automated benchmarking

### 3. Advanced UI

- Interactive diff editing
- Multi-session management
- Cost prediction
- Performance dashboards

### 4. Enterprise Features

- Team workspaces
- SSO integration
- Advanced audit logging
- Policy enforcement

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code style and standards
- Testing requirements
- Documentation standards
- PR review process

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

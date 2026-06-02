# OpenCLI

<div align="center">

**A unified, self-improving CLI agent optimized for open-source LLMs**

[![npm version](https://badge.fury.io/js/opencli.svg)](https://www.npmjs.org/package/opencli)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E=20.0.0-green.svg)](https://nodejs.org/)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Providers](#providers) • [Documentation](#docs)

</div>

---

## ✨ Features

OpenCLI bridges the feature gap between closed-source tools (Claude Code, Gemini CLI) and the open-source ecosystem:

### 🔄 Multi-Provider Support
- **12+ providers**: Claude, GPT, Gemini, Grok, DeepSeek, Qwen, Minimax, GLM, Kimi, Devstral, Ollama, OpenAI-compatible
- **Mid-session switching**: `/provider claude`, `/model gpt-4o`
- **Model comparison**: `opencli benchmark "task"`
- **Model comparison**: `opencli benchmark "task"`

### 🧠 Context Compression
- **Adaptive compression**: 30%+ reduction on long sessions
- **Provider optimization**: 1M context (Minimax), 256K (Qwen), 128K (DeepSeek)
- **Sliding window**: Keep recent messages, preserve system prompt
- **Semantic compression**: Summarize old tool results

### 💰 Cost Tracking
- **Rolling totals**: Daily, weekly, monthly costs
- **Budget enforcement**: 80% warning, 100% blocking
- **Cost export**: CSV/JSON export for analysis
- **Per-provider breakdown**: See costs by provider and model

### 🤖 Multi-Agent Routing
- **Task decomposition**: Automatic subtask planning
- **Specialized models**: Optimal model per task type
- **Cost optimization**: Use cheaper models where appropriate
- **Parallel execution**: Multiple subtasks when possible

### 🔒 Security Features
- **Docker sandbox**: Isolated bash command execution
- **Permission prompts**: Confirm before tool execution
- **Audit logging**: All operations logged to `~/.opencli/audit.log`
- **Secure storage**: API keys in system keychain

### 🧰 Advanced Tools
- **Git operations**: Commit, diff, log, branch management
- **Web search**: Integrated via Brave/Serper APIs
- **File operations**: Read, write, edit with diff preview
- **MCP protocol**: Compatible with Model Context Protocol servers

---

## 📦 Installation

```bash
npm install -g opencli
```

### Requirements

- Node.js >= 20.0.0
- macOS, Linux, or Windows
- (Optional) Docker for sandbox mode

---

## 🚀 Quick Start

### 1. Setup

```bash
opencli setup
```

The interactive wizard will guide you through:
- Selecting providers to configure
- Entering API keys (stored in system keychain)
- Setting default provider and model

### 2. Use

```bash
# Basic usage
opencli "fix the authentication bug"

# Specify provider
opencli -p qwen "explain this codebase"

# Use specific model
opencli -m deepseek-v3 "refactor this function"

# Budget-conscious mode
opencli --budget 5.0 "add input validation"
```

### 3. Examples

```bash
# Debug production issues
opencli -p deepseek "investigate why the API is returning 500"

# Analyze large codebases
opencli -p qwen "explain the architecture of this monorepo"

# Cost-optimized development
opencli profile use budget-conscious
opencli "add unit tests for user.service"

# Local privacy mode
ollama pull codellama
opencli -p ollama "review this sensitive code"

# Web search with GLM
opencli -p glm "search for latest React updates"

# Multi-agent mode
/multiagent
opencli "refactor the authentication module"
```

---

## 🏢 Providers

OpenCLI supports 12+ providers out of the box:

| Provider | Best For | Context | Pricing* | Notes |
|----------|----------|---------|----------|-------|
| **[Claude](https://anthropic.com)** | Best quality | 200K | $3.00/$15.00 | Anthropic's best |
| **[GPT](https://openai.com)** | Most popular | 128K | $2.50/$10.00 | GPT-4o |
| **[Gemini](https://ai.google.dev)** | 1M context | 1M | $0.075/$0.30 | Google's fastest |
| **[Grok](https://x.ai)** | Real-time | 128K | $5.00/$15.00 | xAI flagship |
| **[DeepSeek](https://deepseek.com)** | Cost-effective | 128K | $0.14/$0.28 | Budget choice |
| **[Qwen](https://dashscope.aliyun.com/)** | Large codebases | 256K | $0.50/$1.00 | Large context |
| **[Minimax](https://minimax.chat)** | Massive files | 1M | $0.10/$0.20 | Cheapest |
| **[GLM](https://bigmodel.cn)** | Chinese LLM | 128K | $0.30/$0.60 | Zhipu AI |
| **[Kimi](https://moonshot.cn)** | Quality | 128K | $0.13/$0.18 | Moonshot AI |
| **[Devstral](https://mistral.ai)** | Apache 2.0 | 128K | $0.50/$1.50 | Mistral Codestral |
| **[Ollama](https://ollama.com)** | Local models | Varies | Free | No API key |
| **OpenAI-Compatible** | Custom | Varies | Varies | Generic |

*Pricing per 1M input/output tokens in USD.

### Setup Individual Providers

<details>
<summary>DeepSeek (Recommended)</summary>

```bash
export DEEPSEEK_API_KEY="sk-..."
opencli config set provider deepseek
```
</details>

<details>
<summary>Qwen (Alibaba)</summary>

```bash
export DASHSCOPE_API_KEY="sk-..."
opencli config set provider qwen
```
</details>

<details>
<summary>Minimax</summary>

```bash
export MINIMAX_API_KEY="..."
opencli config set provider minimax
```
</details>

<details>
<summary>GLM (Zhipu AI)</summary>

```bash
export ZHIPUAI_API_KEY="..."
opencli config set provider glm
```
</details>

<details>
<summary>Kimi (Moonshot)</summary>

```bash
export KIMI_API_KEY="sk-..."
opencli config set provider kimi
```
</details>

<details>
<summary>Devstral (Mistral)</summary>

```bash
export DEVSTRAL_API_KEY="..."
opencli config set provider devstral
```
</details>

<details>
<summary>Ollama (Local)</summary>

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3

# Use with OpenCLI
opencli config set provider ollama
```
</details>

<details>
<summary>OpenAI-Compatible</summary>

```bash
export OPENAI_COMPAT_BASE_URL="https://your-endpoint.com/v1"
export OPENAI_COMPAT_API_KEY="..."
opencli config set provider openai-compat
```
</details>

<details>
<summary>Claude (Anthropic)</summary>

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
opencli config set provider claude
```

**Models:**
- `claude-3-5-sonnet-20241022` - Latest, 200K context (recommended)
- `claude-3-opus-20240229` - Maximum capabilities
- `claude-3-haiku-20240307` - Fast, cost-effective

</details>

<details>
<summary>GPT (OpenAI)</summary>

```bash
export OPENAI_API_KEY="sk-..."
opencli config set provider gpt
```

**Models:**
- `gpt-4o` - Latest, multimodal (recommended)
- `gpt-4o-mini` - Fast, cost-effective
- `gpt-4-turbo` - High quality
- `gpt-3.5-turbo` - Budget option

</details>

<details>
<summary>Gemini (Google)</summary>

```bash
export GOOGLE_API_KEY="..."
opencli config set provider gemini
```

**Models:**
- `gemini-2.0-flash-exp` - 1M context, ultra-fast (recommended)
- `gemini-1.5-pro` - Maximum capabilities
- `gemini-1.5-flash` - Fast, cost-effective

</details>

<details>
<summary>Grok (xAI)</summary>

```bash
export XAI_API_KEY="..."
opencli config set provider grok
```

**Models:**
- `grok-2` - Latest, vision support (recommended)
- `grok-beta` - Experimental access
- `grok-vision-beta` - Vision-focused

</details>

---

## 📚 Documentation

### Architecture

- [Architecture Documentation](docs/architecture.md) - System design and data flow
- [Provider Setup Guide](docs/provider-setup.md) - Detailed provider configuration
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

### Configuration

```bash
# View configuration
opencli config list

# Set default provider
opencli config set provider deepseek

# Set budget limits
opencli config set budget.limit 10

# Enable Docker sandbox
opencli config set tools.sandbox true

# Use profiles
opencli profile use fast
opencli profile use power
```

### Cost Management

```bash
# View cost dashboard
opencli cost show

# Export costs
opencli cost export --format csv > costs.csv

# Set budget limit
opencli config set budget.limit 10
```

### Advanced Features

```bash
# Multi-agent mode
/multiagent
opencli "refactor authentication module"

# Knowledge brain search
opencli knowledge search "context compression"

# Manual compression
/compress force

# Benchmark providers
opencli benchmark "add error handling"
```

---

## 🧰 Tools

OpenCLI includes powerful tools for development:

### Bash Tool
Execute shell commands with permission prompts:
```bash
opencli "run the test suite and fix failing tests"
```

### File Operations
Read, write, and edit files:
```bash
opencli "add input validation to user.service.ts"
```

### Git Tool
Git operations integrated:
```bash
opencli "commit the changes with a descriptive message"
opencli "create a new feature branch for auth fix"
```

### Web Search
Built-in web search (via GLM or external API):
```bash
opencli "search for the latest React best practices"
```

---

## 🔒 Security

### Docker Sandbox Mode

Run bash commands in isolated containers:

```bash
# Enable sandbox
opencli config set tools.sandbox true

# Run in sandbox
opencli --sandbox "analyze this untrusted script"
```

### Permission Prompts

All tool executions require confirmation:
```
[Tool: bash] Executing command:
  rm -rf node_modules
  
Execute this command? [Y/n]
```

### Audit Logging

All operations logged to `~/.opencli/audit.log`:
```bash
cat ~/.opencli/audit.log
```

---

## 💡 Usage Tips

### Cost Optimization

```bash
# Use cheaper models for simple tasks
opencli -m qwen-turbo "format this code"

# Set budget limits
opencli config set budget.limit 5

# Use profiles
opencli profile use budget-conscious
```

### Context Management

```bash
# Manual compression
/compress force

# Change strategy
opencli config set compression.strategy sliding

# View context stats
opencli /compress stats
```

### Provider Selection

```bash
# Quick tasks - use fast models
opencli -p qwen -m qwen-turbo "task"

# Complex tasks - use capable models
opencli -p deepseek -m deepseek-v3 "task"

# Large files - use large context
opencli -p minimax "analyze this file"

# Privacy - use local models
opencli -p ollama "task"
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/open-cli/opencli
cd opencli

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local development
npm link
```

### Project Structure

```
opencli/
├── src/
│   ├── core/          # Agent loop, session, planner
│   ├── providers/     # Provider implementations
│   ├── tools/         # Tool implementations
│   ├── knowledge/     # Knowledge brain system
│   ├── cost/          # Cost tracking
│   └── ui/            # Terminal UI components
├── tests/             # Unit and integration tests
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

---

## 📈 Roadmap

### v0.9.0 (Current Beta)
- ✅ Multi-provider support
- ✅ Context compression
- ✅ Cost tracking
- ✅ Multi-agent routing
- ✅ Security features
- ✅ Advanced tools

### v1.0.0 (Upcoming)
- [ ] GitHub Integration
- [ ] Enhanced UI with Ink
- [ ] Additional providers
- [ ] Performance optimizations
- [ ] Comprehensive documentation

### Future Plans
- [ ] VS Code extension
- [ ] Team collaboration features
- [ ] Enterprise SSO support
- [ ] Custom model fine-tuning
- [ ] Plugin system

---

## 📊 Comparison

| Feature | OpenCLI | Claude Code | Gemini CLI | Aider |
|---------|---------|-------------|------------|-------|
| Multi-Provider | ✅ 12+ | ❌ 1 | ❌ 1 | ✅ 3+ |
| Context Compression | ✅ | ✅ | ❌ | ✅ |
| Cost Tracking | ✅ | ❌ | ❌ | ❌ |
| Multi-Agent | ✅ | ❌ | ❌ | ❌ |
| Docker Sandbox | ✅ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ❌ | ❌ | ✅ |
| Local Models | ✅ | ❌ | ❌ | ✅ |
| MCP Protocol | ✅ | ✅ | ❌ | ❌ |

---

## 🙏 Acknowledgments

Built with inspiration from:
- **Claude Code** - Provider adapter pattern
- **Aider** - Context compression strategies
- **Qwen-Code** - Multi-provider support
- **Cursor** - Terminal UI design

---

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

---

## 🌟 Star Us

If you find OpenCLI useful, please consider giving us a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=open-cli/opencli&type=Date)](https://star-history.com/#open-cli/opencli&Date)

---

## 🔗 Links

- **npm**: [https://www.npmjs.com/package/opencli](https://www.npmjs.com/package/opencli)
- **GitHub**: [https://github.com/open-cli/opencli](https://github.com/open-cli/opencli)
- **Documentation**: [https://docs.opencli.dev](https://docs.opencli.dev)
- **Discussions**: [https://github.com/open-cli/opencli/discussions](https://github.com/open-cli/opencli/discussions)
- **Issues**: [https://github.com/open-cli/opencli/issues](https://github.com/open-cli/opencli/issues)

---

<div align="center">

**Built with ❤️ for the open-source community**

[🔝 Back to Top](#opencli)

</div>
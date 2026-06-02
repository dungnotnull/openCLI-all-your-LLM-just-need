# Provider Setup Guide

OpenCLI supports 12+ model providers out of the box. This guide walks through setting up each provider.

## Quick Start

```bash
# Install OpenCLI
npm install -g opencli

# Run setup wizard
opencli setup

# Start using
opencli "explain this codebase"
```

## Provider Overview

| Provider | Best For | Context Window | Pricing* | Notes |
|----------|----------|---------------|---------|-------|
| **Claude** | Best quality | 200K | $3.00/$15.00 per 1M | Anthropic's best |
| **GPT** | Most popular | 128K | $2.50/$10.00 per 1M | GPT-4o |
| **Gemini** | 1M context | 1M | $0.075/$0.30 per 1M | Google's fastest |
| **Grok** | Real-time | 128K | $5.00/$15.00 per 1M | xAI flagship |
| **DeepSeek** | Cost-effective | 128K | $0.14/$0.28 per 1M | Budget choice |
| **Qwen** | Large codebases | 256K | $0.50/$1.00 per 1M | Large context |
| **Minimax** | Massive files | 1M | $0.10/$0.20 per 1M | Cheapest |
| **GLM** | Web search | 128K | $0.30/$0.60 per 1M | Built-in search |
| **Kimi** | Quality | 32K | $2.00/$4.00 per 1M | LiveBench leader |
| **Devstral** | Apache 2.0 | 32K | $0.50/$1.00 per 1M | Open source |
| **Ollama** | Local models | Varies | Free | No API key needed |
| **OpenAI-Compat** | Custom endpoints | Varies | Varies | Generic support |

*Pricing shown per 1M input/output tokens in USD. Subject to change.

---

## Individual Provider Setup

### 1. DeepSeek (Recommended)

DeepSeek offers excellent coding capabilities at very low cost.

**Getting an API Key:**

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select DeepSeek (option 1)

# Or manually
export DEEPSEEK_API_KEY="your_api_key_here"
opencli config set provider deepseek
```

**Models:**
- `deepseek-v3` - Default, strong coding (recommended)
- `deepseek-v3-lite` - Faster, cheaper
- `deepseek-coder` - Specialized for code

**Environment Variable:**
```bash
export DEEPSEEK_API_KEY="sk-..."
```

**Pros:**
- ✅ Lowest cost among cloud providers
- ✅ Strong coding capabilities
- ✅ Fast response times
- ✅ Good for daily use

**Cons:**
- ⚠️ Newer provider, less established
- ⚠️ Occasional rate limits

---

### 2. Claude (Anthropic)

Claude offers the highest quality outputs with excellent coding capabilities.

**Getting an API Key:**

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Claude (option 2)

# Or manually
export ANTHROPIC_API_KEY="sk-ant-..."
opencli config set provider claude
```

**Models:**
- `claude-3-5-sonnet-20241022` - Latest, 200K context (recommended)
- `claude-3-opus-20240229` - Maximum capabilities
- `claude-3-haiku-20240307` - Fast, cost-effective

**Environment Variable:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Pros:**
- ✅ Highest quality outputs
- ✅ Excellent coding capabilities
- ✅ Large 200K context window
- ✅ Multimodal (images + text)

**Cons:**
- ⚠️ Highest cost among providers
- ⚠️ Can have rate limits
- ⚠️ More expensive output tokens

---

### 3. GPT (OpenAI)

GPT is the most popular and widely supported AI model.

**Getting an API Key:**

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select GPT (option 3)

# Or manually
export OPENAI_API_KEY="sk-..."
opencli config set provider gpt
```

**Models:**
- `gpt-4o` - Latest, multimodal (recommended)
- `gpt-4o-mini` - Fast, cost-effective
- `gpt-4-turbo` - High quality
- `gpt-3.5-turbo` - Budget option

**Environment Variable:**
```bash
export OPENAI_API_KEY="sk-..."
```

**Pros:**
- ✅ Most widely supported
- ✅ Excellent documentation
- ✅ Multimodal capabilities
- ✅ Reliable performance

**Cons:**
- ⚠️ Higher pricing
- ⚠️ Can have rate limits
- ⚠️ Strict content policies

---

### 4. Gemini (Google)

Gemini offers ultra-fast responses with 1M context window.

**Getting an API Key:**

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Gemini (option 4)

# Or manually
export GOOGLE_API_KEY="..."
opencli config set provider gemini
```

**Models:**
- `gemini-2.0-flash-exp` - 1M context, ultra-fast (recommended)
- `gemini-1.5-pro` - Maximum capabilities
- `gemini-1.5-flash` - Fast, cost-effective

**Environment Variable:**
```bash
export GOOGLE_API_KEY="..."
```

**Pros:**
- ✅ Massive 1M context window
- ✅ Ultra-fast responses
- ✅ Very cost-effective
- ✅ Google ecosystem integration

**Cons:**
- ⚠️ Newer API, changing rapidly
- ⚠️ Documentation can be sparse

---

### 5. Grok (xAI)

Grok provides real-time knowledge with excellent reasoning capabilities.

**Getting an API Key:**

1. Visit [xAI Console](https://console.x.ai/)
2. Sign up for Grok access
3. Navigate to API Keys section
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Grok (option 5)

# Or manually
export XAI_API_KEY="..."
opencli config set provider grok
```

**Models:**
- `grok-2` - Latest, vision support (recommended)
- `grok-beta` - Experimental access
- `grok-vision-beta` - Vision-focused

**Environment Variable:**
```bash
export XAI_API_KEY="..."
```

**Pros:**
- ✅ Real-time knowledge access
- ✅ Excellent reasoning
- ✅ Vision capabilities
- ✅ Growing ecosystem

**Cons:**
- ⚠️ High cost
- ⚠️ Newer provider
- ⚠️ May have availability limits

---

### 6. Qwen (Alibaba)

Qwen offers excellent performance with the largest context window.

**Getting an API Key:**

1. Visit [DashScope Console](https://dashscope.console.aliyun.com/)
2. Sign up/log in with Alibaba Cloud account
3. Navigate to API-KEY management
4. Create a new API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Qwen (option 2)

# Or manually
export DASHSCOPE_API_KEY="your_api_key_here"
opencli config set provider qwen
```

**Models:**
- `qwen-coder-plus` - Best for coding (recommended)
- `qwen-plus` - General purpose
- `qwen-turbo` - Fast, cost-effective
- `qwen-max` - Maximum capabilities

**Environment Variable:**
```bash
export DASHSCOPE_API_KEY="sk-..."
```

**Pros:**
- ✅ 256K context window (largest)
- ✅ Strong coding performance
- ✅ Established provider
- ✅ Good for large codebases

**Cons:**
- ⚠️ Higher cost than DeepSeek
- ⚠️ Can have rate limits

---

### 3. Minimax

Minimax provides the largest context window at competitive pricing.

**Getting an API Key:**

1. Visit [Minimax Platform](https://api.minimax.chat/)
2. Register for an account
3. Navigate to API Keys section
4. Generate API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Minimax (option 3)

# Or manually
export MINIMAX_API_KEY="your_api_key_here"
opencli config set provider minimax
```

**Models:**
- `abab6.5s-chat` - Default (recommended)
- `abab6.5-chat` - Slower, more capable
- `abab5.5-chat` - Legacy model

**Environment Variable:**
```bash
export MINIMAX_API_KEY="your_api_key_here"
```

**Pros:**
- ✅ 1M context window (massive)
- ✅ Cost-effective
- ✅ Good for large file analysis

**Cons:**
- ⚠️ Newer provider
- ⚠️ Less documentation

---

### 4. GLM (Zhipu AI)

GLM offers built-in web search capabilities.

**Getting an API Key:**

1. Visit [Zhipu AI Platform](https://open.bigmodel.cn/)
2. Register for an account
3. Navigate to API Keys
4. Create new key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select GLM (option 4)

# Or manually
export ZHIPUAI_API_KEY="your_api_key_here"
opencli config set provider glm
```

**Models:**
- `glm-4-flash` - Fast, cost-effective (recommended)
- `glm-4-plus` - Balanced
- `glm-4-0520` - Latest model
- `glm-4-air` - Lightweight

**Environment Variable:**
```bash
export ZHIPUAI_API_KEY="your_api_key_here"
```

**Built-in Web Search:**

GLM has native web search — no external tool needed:

```bash
opencli -p glm "search for latest React updates"
```

**Pros:**
- ✅ Built-in web search
- ✅ Good balance of speed/cost
- ✅ Established Chinese provider

**Cons:**
- ⚠️ May require phone verification
- ⚠️ Documentation in Chinese

---

### 5. Kimi (Moonshot AI)

Kimi is a LiveBench leader with aggressive rate limit handling.

**Getting an API Key:**

1. Visit [Moonshot Platform](https://platform.moonshot.cn/)
2. Sign up for an account
3. Navigate to API Keys
4. Generate API key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Kimi (option 5)

# Or manually
export KIMI_API_KEY="your_api_key_here"
opencli config set provider kimi
```

**Models:**
- `moonshot-v1-8k` - Fast (recommended)
- `moonshot-v1-32k` - Larger context
- `moonshot-v1-128k` - Maximum context

**Environment Variable:**
```bash
export KIMI_API_KEY="your_api_key_here"
```

**Pros:**
- ✅ High quality outputs
- ✅ LiveBench leader
- ✅ Good rate limit handling

**Cons:**
- ⚠️ Higher pricing
- ⚠️ Restrictive rate limits
- ⚠️ 32K default context

---

### 6. Devstral (Mistral)

Devstral provides Apache 2.0 licensed models with image support.

**Getting an API Key:**

1. Visit [Mistral AI Platform](https://console.mistral.ai/)
2. Sign up for an account
3. Navigate to API Keys
4. Create new key

**Configuration:**

```bash
# Via setup wizard
opencli setup
# Select Devstral (option 6)

# Or manually
export DEVSTRAL_API_KEY="your_api_key_here"
opencli config set provider devstral
```

**Models:**
- `mistral-large-latest` - Most capable
- `mistral-medium-latest` - Balanced
- `codestral-latest` - Coding specialized
- `pixtral-12b` - Image understanding

**Environment Variable:**
```bash
export DEVSTRAL_API_KEY="your_api_key_here"
```

**Local Setup (vLLM):**

```bash
# Install vLLM
pip install vllm

# Run Devstral locally
vllm serve mistralai/Devstral-Small-2 --port 11434

# Configure OpenCLI
export OPENAI_COMPAT_BASE_URL="http://localhost:11434"
```

**Pros:**
- ✅ Apache 2.0 license
- ✅ Image input support
- ✅ Good open-source backing
- ✅ Local deployment option

**Cons:**
- ⚠️ Higher API cost
- ⚠️ 32K context limit
- ⚠️ Requires GPU for local deployment

---

### 7. Ollama (Local Models)

Ollama allows running models locally with no API costs.

**Installation:**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or on Windows
# Download from https://ollama.com/download

# Pull a model
ollama pull llama3
ollama pull codellama
```

**Configuration:**

```bash
# No API key needed
opencli config set provider ollama
opencli config set model llama3
```

**Models:**
- `llama3` - General purpose (recommended)
- `codellama` - Coding specialized
- `mistral` - Open source
- `phi3` - Small, fast
- `qwen2.5-coder` - Strong coding
- Any model from [Ollama Library](https://ollama.com/library)

**Auto-Detection:**

OpenCLI automatically detects installed Ollama models:

```bash
opencli -p ollama "task"  # Uses default model
opencli -p ollama -m qwen2.5-coder "task"  # Specific model
```

**Pros:**
- ✅ No API costs
- ✅ Privacy (local execution)
- ✅ No rate limits
- ✅ Works offline
- ✅ Auto-detects available models

**Cons:**
- ⚠️ Requires GPU for good performance
- ⚠️ Limited to available models
- ⚠️ Slower than cloud providers
- ⚠️ Hardware cost for GPU

---

### 8. OpenAI-Compatible Endpoints

For any OpenAI-compatible endpoint (Azure, OpenRouter, Fireworks AI, local vLLM, etc.).

**Configuration:**

```bash
# Set base URL and API key
export OPENAI_COMPAT_BASE_URL="https://your-endpoint.com/v1"
export OPENAI_COMPAT_API_KEY="your_api_key_here"

# Register as custom provider
opencli config set provider openai-compat
opencli config set model your-model-name
```

**OpenRouter Setup:**

```bash
export OPENROUTER_API_KEY="sk-..."
opencli config set provider openai-compat
opencli config set openai-compat.base_url "https://openrouter.ai/api/v1"
opencli config set openai-compat.model "qwen/qwen-2.5-coder-32b"
```

**BYOK (Bring Your Own Key):**

For providers with OpenAI-compatible APIs:

```bash
opencli config set provider openai-compat
opencli config set openai-compat.base_url "https://your-provider.com/v1"
opencli config set openai-compat.api_key "your-key"
opencli config set openai-compat.model "model-name"
```

**Models:**
- Any model available at your endpoint
- Specify with `--model` flag

**Environment Variables:**
```bash
export OPENAI_COMPAT_BASE_URL="https://..."
export OPENAI_COMPAT_API_KEY="sk-..."
```

**Pros:**
- ✅ Maximum flexibility
- ✅ Works with any OpenAI-compatible endpoint
- ✅ Good for custom deployments
- ✅ Access to many models via OpenRouter

**Cons:**
- ⚠️ Requires endpoint configuration
- ⚠️ May need custom model mappings
- ⚠️ Variable pricing by endpoint

---

## Configuration File

Store settings in `~/.opencli/config.yml`:

```yaml
# Default Provider
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

# Provider-specific settings
providers:
  deepseek:
    api_key: "sk-..."
  qwen:
    api_key: "sk-..."
```

---

## Advanced Configuration

### Multiple Providers

OpenCLI can work with multiple providers simultaneously:

```bash
# Set default provider
opencli config set provider deepseek

# Switch mid-session
/model qwen
/provider kimi
```

### Provider Profiles

Create named profiles for different use cases:

```bash
# Fast profile for quick tasks
opencli profile create fast --provider qwen --model qwen-turbo

# Power profile for complex tasks
opencli profile create power --provider deepseek --model deepseek-v3

# Budget-conscious profile
opencli profile create budget-conscious --provider qwen --model qwen-turbo --budget 5.0

# Use profiles
opencli profile use fast
opencli profile use power
```

### Budget Management

Set spending limits per session:

```bash
# Set $10 monthly limit
opencli config set budget.limit 10

# Enable budget warnings at 80%
opencli config set budget.warn_percent 0.8

# Ignore budget for critical tasks (with confirmation)
opencli --ignore-budget "fix production bug"

# Check current spending
opencli cost show
opencli cost export --format csv > costs.csv
```

### Context Optimization

Adjust compression settings for your workflow:

```bash
# Adaptive compression (recommended)
opencli config set compression.strategy adaptive

# Sliding window for speed
opencli config set compression.strategy sliding

# Disabled for maximum context
opencli config set compression.strategy disabled

# Manual compression trigger
opencli /compress force
```

---

## Troubleshooting

### API Key Issues

**Problem:** "API key not found" error

**Solution:**
```bash
# Verify key is set
echo $DEEPSEEK_API_KEY  # Replace with your provider

# Check config
opencli config list

# Re-run setup
opencli setup

# Or set manually in ~/.opencli/config.yml
```

### Rate Limits

**Problem:** "Rate limit exceeded" error

**Solutions:**
- Switch to a different provider temporarily
- Use cost-effective models (turbo/lite variants)
- Implement retry logic in your scripts
- Consider higher-tier plans

**Provider Rate Limits:**
- **Kimi**: Most restrictive, use exponential backoff
- **Qwen**: Moderate limits
- **DeepSeek**: Generous limits
- **Ollama**: No rate limits (local)

### Network Issues

**Problem:** "Connection timeout" or "network error"

**Solution:**
```bash
# Check connectivity
ping api.deepseek.com  # Replace with your provider

# Try with VPN if international
# Or use local models (Ollama)

# Increase timeout in config.yml
opencli config set timeout 120
```

### Model Not Found

**Problem:** "Model not found" error

**Solution:**
```bash
# List available models
opencli config list

# Check provider documentation for current model names
# Model names change over time
```

### Docker Sandbox Issues

**Problem:** Sandbox mode not working

**Solution:**
```bash
# Verify Docker is running
docker --version
docker ps

# Check if container exists
docker ps -a | grep sandbox

# Disable sandbox if Docker unavailable
opencli config set tools.sandbox false
```

---

## Cost Comparison

Based on typical coding session (10K input, 5K output tokens):

| Provider | Cost per Session | Sessions per $10 | Notes |
|----------|------------------|------------------|-------|
| DeepSeek | $0.0028 | ~3,571 | Best value |
| Minimax | $0.0020 | ~5,000 | Cheapest |
| Qwen Turbo | $0.0075 | ~1,333 | Fast |
| GLM Flash | $0.0045 | ~2,222 | Web search |
| Qwen Plus | $0.0150 | ~666 | Large context |
| Devstral | $0.0150 | ~666 | Apache 2.0 |
| Kimi | $0.0600 | ~166 | Best quality |
| Ollama | $0.00 | ∞ | Hardware cost only |

*Estimates based on typical usage patterns. Actual costs vary by task complexity.

---

## Security Best Practices

### 1. API Key Storage

```bash
# ✅ Good - Stored in system keychain
opencli setup

# ❌ Bad - In shell history
export DEEPSEEK_API_KEY="sk-..."  # Visible in history

# ✅ Good - In .env file (add to .gitignore)
echo 'DEEPSEEK_API_KEY="sk-..."' >> .env
```

### 2. Permission Management

```bash
# Always confirm tool executions
# OpenCLI prompts by default

# For automated scripts, use specific allow-lists
opencli --allow bash,git-read "automated task"
```

### 3. Audit Logging

```bash
# Check what was executed
cat ~/.opencli/audit.log

# Review costs
opencli cost export --format csv > costs.csv
```

### 4. Docker Sandbox

```bash
# Enable for untrusted code
opencli config set tools.sandbox true

# Run untrusted scripts in sandbox
opencli --sandbox "analyze this external script"
```

---

## Quick Reference

### Environment Variables

```bash
DEEPSEEK_API_KEY="sk-..."
DASHSCOPE_API_KEY="sk-..."
MINIMAX_API_KEY="..."
ZHIPUAI_API_KEY="..."
KIMI_API_KEY="..."
DEVSTRAL_API_KEY="..."
```

### CLI Commands

```bash
# Setup
opencli setup                    # Interactive setup wizard
opencli config list             # View configuration
opencli profile use <name>      # Switch profile

# Providers
opencli -p <provider> "task"    # Use specific provider
opencli -m <model> "task"       # Use specific model
/model <model>                  # Switch model mid-session
/provider <provider>            # Switch provider mid-session

# Cost
opencli cost show               # View cost dashboard
opencli cost export             # Export cost data

# Knowledge
opencli knowledge crawl         # Manually trigger knowledge crawl
opencli knowledge search "<query>"  # Search knowledge base

# Multi-Agent
/multiagent                     # Toggle multi-agent mode
opencli benchmark "task"        # Compare providers
```

---

## Next Steps

1. **Choose a provider** based on your needs and budget
2. **Run setup wizard**: `opencli setup`
3. **Test with simple task**: `opencli "explain this function"`
4. **Set up profiles** for different workflows
5. **Configure budget** limits to control spending
6. **Join community** at [GitHub Discussions](https://github.com/open-cli/opencli/discussions)

For more information, see:
- [Architecture Documentation](architecture.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Project Development Tracking](../PROJECT-DEVELOPMENT-PHASE-TRACKING.md)

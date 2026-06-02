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

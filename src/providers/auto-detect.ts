import { loadConfig } from '../utils/config.js';
import { getProvider } from './registry.js';

export async function detectConfiguredProviders(): Promise<string[]> {
  const config = await loadConfig();
  const providers: string[] = [];

  // Check if providers are configured in config
  if (config.providers) {
    for (const [providerId, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig.apiKey) {
        providers.push(providerId);
      }
    }
  }

  // Check environment variables
  const envVarMap: Record<string, string> = {
    deepseek: 'DEEPSEEK_API_KEY',
    qwen: 'DASHSCOPE_API_KEY',
    minimax: 'MINIMAX_API_KEY',
    glm: 'ZHIPUAI_API_KEY',
    kimi: 'KIMI_API_KEY',
    devstral: 'DEVSTRAL_API_KEY',
  };

  for (const [providerId, envVar] of Object.entries(envVarMap)) {
    if (process.env[envVar] && !providers.includes(providerId)) {
      providers.push(providerId);
    }
  }

  return providers;
}

export async function initializeProvider(providerId: string): Promise<string | null> {
  const config = await loadConfig();

  // Try to get API key from config
  const providerConfig = config.providers?.[providerId];
  const apiKey = providerConfig?.apiKey || process.env[providerId.toUpperCase() + '_API_KEY'];

  if (!apiKey) {
    return null;
  }

  const provider = await getProvider(providerId, apiKey);
  if (provider) {
    return providerId;
  }

  return null;
}

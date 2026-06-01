import keytar from "keytar";

const SERVICE_NAME = "opencli";

export async function setApiKey(provider: string, key: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, provider, key);
}

export async function getApiKey(provider: string): Promise<string | null> {
  return await keytar.getPassword(SERVICE_NAME, provider);
}

export async function deleteApiKey(provider: string): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, provider);
}

export function getApiKeyOrEnv(provider: string, envVar: string): string | null {
  const env = process.env[envVar];
  if (env) {
    return env;
  }
  return null;
}

export async function listProviders(): Promise<string[]> {
  return ["deepseek", "qwen", "minimax", "glm", "kimi", "devstral", "ollama"];
}

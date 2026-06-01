import keytar from "keytar";
const SERVICE_NAME = "opencli";
export async function setApiKey(provider, key) {
    await keytar.setPassword(SERVICE_NAME, provider, key);
}
export async function getApiKey(provider) {
    return await keytar.getPassword(SERVICE_NAME, provider);
}
export async function deleteApiKey(provider) {
    await keytar.deletePassword(SERVICE_NAME, provider);
}
export function getApiKeyOrEnv(provider, envVar) {
    const env = process.env[envVar];
    if (env) {
        return env;
    }
    return null;
}
export async function listProviders() {
    return ["deepseek", "qwen", "minimax", "glm", "kimi", "devstral", "ollama"];
}
//# sourceMappingURL=secure-storage.js.map
import readline from 'node:readline';
import { setApiKey } from '../utils/secure-storage.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

export async function setupWizard(): Promise<void> {
  console.log('\n🚀 OpenCLI Setup Wizard\n');
  console.log('This wizard will help you configure your API keys.\n');
  console.log('Your keys will be stored securely in your system keychain.\n');

  const providers = [
    { id: 'deepseek', name: 'DeepSeek (Cheapest, good for coding)', envVar: 'DEEPSEEK_API_KEY' },
    { id: 'claude', name: 'Claude (Anthropic - Best quality)', envVar: 'ANTHROPIC_API_KEY' },
    { id: 'gpt', name: 'GPT (OpenAI - Most popular)', envVar: 'OPENAI_API_KEY' },
    { id: 'gemini', name: 'Gemini (Google - 1M context)', envVar: 'GOOGLE_API_KEY' },
    { id: 'grok', name: 'Grok (xAI - Real-time knowledge)', envVar: 'XAI_API_KEY' },
    { id: 'qwen', name: 'Qwen (256K context, strong coding)', envVar: 'DASHSCOPE_API_KEY' },
    { id: 'minimax', name: 'Minimax (1M context window)', envVar: 'MINIMAX_API_KEY' },
    { id: 'glm', name: 'GLM Zhipu (Built-in web search)', envVar: 'ZHIPUAI_API_KEY' },
    { id: 'kimi', name: 'Kimi (LiveBench leader)', envVar: 'KIMI_API_KEY' },
    { id: 'devstral', name: 'Devstral (Apache 2.0, local)', envVar: 'DEVSTRAL_API_KEY' },
    { id: 'ollama', name: 'Ollama (Local - Free)', envVar: 'N/A' },
  ];

  console.log('Available providers:');
  providers.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Environment variable: ${p.envVar}\n`);
  });

  const selected = await question('Select providers to configure (comma-separated, e.g., 1,3,5): ');
  const indices = selected.split(',').map(s => parseInt(s.trim(), 10) - 1);

  for (const index of indices) {
    if (index >= 0 && index < providers.length) {
      const provider = providers[index];
      if (!provider) continue;

      console.log(`\n📝 Configuring ${provider.name}...`);

      const checkEnv = await question(`  Check for ${provider.envVar} environment variable? (Y/n): `);

      if (checkEnv.toLowerCase() !== 'n' && process.env[provider.envVar]) {
        console.log(`  ✅ Found in environment: ${provider.envVar}`);
        await setApiKey(provider.id, process.env[provider.envVar]!);
      } else {
        const apiKey = await question(`  Enter API key (or press Enter to skip): `);
        if (apiKey) {
          await setApiKey(provider.id, apiKey);
          console.log(`  ✅ API key stored for ${provider.id}`);
        } else {
          console.log(`  ⏭️  Skipped ${provider.id}`);
        }
      }
    }
  }

  const defaultProvider = await question('\n🎯 Set default provider (deepseek): ');
  console.log(`\n✅ Setup complete!\n`);
  console.log('You can now run:');
  console.log('  opencli "your coding task here"');
  console.log('  opencli -p <provider> "task"');
  console.log('  opencli config list\n');

  rl.close();
}

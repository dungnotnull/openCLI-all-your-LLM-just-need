import { getProvider } from '../providers/registry.js';
import { handleCompressCommand } from './compress.js';
export async function handleSlashCommand(command, context) {
    const [cmd, ...args] = command.split(' ');
    switch (cmd) {
        case '/model':
            return await handleModelSwitch(args[0], context);
        case '/provider':
            return await handleProviderSwitch(args[0], context);
        case '/compress':
            return await handleCompressCommand(context.session, {
                force: args.includes('force'),
                reset: args.includes('reset'),
                strategy: args.find(a => ['sliding', 'semantic', 'adaptive'].includes(a)),
            });
        case '/cost':
            return `Current session cost: $0.00 (not yet implemented)`;
        case '/help':
            return `Available slash commands:
/model <name>     - Switch model
/provider <name>  - Switch provider
/compress         - Show compression stats
/compress force   - Force compression
/compress reset   - Reset compression history
/compress strategy <name> - Set compression strategy (sliding/semantic/adaptive)
/cost             - Show session cost
/help             - Show this message`;
        default:
            return `Unknown slash command: ${cmd}. Type /help for available commands.`;
    }
}
async function handleModelSwitch(modelId, context) {
    if (!modelId) {
        return `Please specify a model. Current model: ${context.currentModel}`;
    }
    await context.switchModel(modelId);
    return `Switched to model: ${modelId}`;
}
async function handleProviderSwitch(providerId, context) {
    if (!providerId) {
        return `Please specify a provider. Current provider: ${context.currentProvider}`;
    }
    const provider = await getProvider(providerId);
    if (!provider) {
        return `Unknown provider: ${providerId}`;
    }
    await context.switchProvider(providerId);
    return `Switched to provider: ${providerId} (${provider.name})`;
}
//# sourceMappingURL=slash.js.map
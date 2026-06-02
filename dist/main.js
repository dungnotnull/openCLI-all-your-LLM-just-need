#!/usr/bin/env node
/**
 * OpenCLI - Multi-Provider Coding Agent CLI
 *
 * Phase 1 Implementation:
 * - Commander.js CLI with flags for provider, model, cost dashboard, debug mode
 * - Integration with agent loop, session manager, tool registry, cost tracker
 * - Support for both task mode and interactive mode (Phase 1: task only)
 */
import { Command } from "commander";
import { loadConfig } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { getProvider, listProviders } from "./providers/registry.js";
import { SessionManager } from "./memory/session-memory.js";
import { agentLoop } from "./core/agent-loop.js";
import { ToolRegistry } from "./tools/registry.js";
import { BashTool } from "./tools/bash.js";
import { FileReadTool } from "./tools/file-read.js";
import { FileWriteTool } from "./tools/file-write.js";
import { FileEditTool } from "./tools/file-edit.js";
import { CostTracker } from "./cost/tracker.js";
/**
 * Main CLI Program
 */
const program = new Command();
// Setup command (separate from main command)
const setupCommand = new Command()
    .name('setup')
    .description('Interactive setup wizard for OpenCLI')
    .action(async () => {
    const { setupWizard } = await import('./commands/setup.js');
    await setupWizard();
});
program
    .name("opencli")
    .description("Multi-provider coding agent CLI for open-source LLMs")
    .version("0.1.0")
    .argument("[task]", "Optional task description to process")
    .option("--provider <name>", "Provider to use (default: deepseek)", "deepseek")
    .option("--model <name>", "Model to use (default: provider default)")
    .option("--cost", "Show cost dashboard", false)
    .option("--debug", "Enable verbose logging", false)
    .action(async (task, options) => {
    try {
        // Enable debug logging if requested
        if (options.debug) {
            logger.level = "debug";
            logger.debug("Debug mode enabled");
        }
        // Load configuration
        logger.info("Loading OpenCLI configuration...");
        const config = await loadConfig();
        // Override config with CLI flags
        const providerId = options.provider || config.provider;
        const modelId = options.model || config.model;
        logger.info({ provider: providerId, model: modelId }, "Using provider and model");
        // Show cost dashboard if requested (before provider initialization to avoid API key requirement)
        if (options.cost) {
            const costTracker = new CostTracker();
            const rates = costTracker.getRates(providerId);
            console.log("\n=== Cost Dashboard ===");
            console.log(`Provider: ${providerId}`);
            console.log(`Session Total: $${costTracker.getSessionTotal().toFixed(6)}`);
            console.log(`Calls Tracked: ${costTracker.getCallCount()}`);
            console.log(`Input Rate: $${rates?.inputCostPerMillion ?? 0}/1M tokens`);
            console.log(`Output Rate: $${rates?.outputCostPerMillion ?? 0}/1M tokens`);
            console.log("===================\n");
            process.exit(0);
        }
        // If no task provided, show usage information and exit
        if (!task && !options.cost) {
            console.log("\n🤖 OpenCLI v0.1.0 - Phase 1");
            console.log("Multi-provider coding agent CLI for open-source LLMs\n");
            console.log("Usage:");
            console.log("  opencli [options] [task]");
            console.log('  opencli "Fix the bug in src/main.ts"');
            console.log('  opencli --provider qwen "Explain this code"\n');
            console.log("Options:");
            console.log("  --provider <name>   Provider to use (default: deepseek)");
            console.log("  --model <name>      Model to use (default: provider default)");
            console.log("  --cost              Show cost dashboard");
            console.log("  --debug             Enable verbose logging");
            console.log("  -h, --help          Show help");
            console.log("  -V, --version       Show version number\n");
            console.log("Available Providers:");
            for (const pId of listProviders()) {
                console.log(`  - ${pId}`);
            }
            console.log();
            console.log("Examples:");
            console.log(`  opencli "Create a REST API with Express"`);
            console.log(`  opencli --provider qwen "Explain async generators"`);
            console.log(`  opencli --model deepseek-v3 "Refactor this function"\n`);
            process.exit(0);
        }
        // Get provider instance
        logger.info(`Initializing provider: ${providerId}`);
        const provider = await getProvider(providerId, config.apiKey);
        if (!provider) {
            logger.error({ provider: providerId }, "Provider not found");
            console.error(`\nError: Provider '${providerId}' not found.`);
            console.error(`Available providers: ${listProviders().join(", ")}\n`);
            process.exit(1);
        }
        // Get model descriptor
        const models = provider.models;
        const modelDescriptor = models.find((m) => m.id === modelId) || models[0];
        if (!modelDescriptor) {
            logger.error({ provider: providerId, model: modelId }, "Model not found");
            console.error(`\nError: Model '${modelId}' not found for provider '${providerId}'.`);
            console.error(`Available models: ${models.map((m) => m.id).join(", ")}\n`);
            process.exit(1);
        }
        logger.info({ provider: provider.name, model: modelDescriptor.name }, "Provider and model initialized");
        // Initialize session
        const session = new SessionManager(provider, modelDescriptor);
        logger.info({ sessionId: session.id }, "Session created");
        // Initialize tool registry
        const toolRegistry = ToolRegistry.getInstance();
        toolRegistry.register(new BashTool());
        toolRegistry.register(new FileReadTool());
        toolRegistry.register(new FileWriteTool());
        toolRegistry.register(new FileEditTool());
        logger.info({ toolCount: toolRegistry.size }, "Tools registered");
        // Initialize cost tracker
        const costTracker = new CostTracker();
        logger.info("Cost tracker initialized");
        // If task provided, run agent loop
        if (task) {
            console.log(`\n🤖 OpenCLI v0.1.0 - Phase 1`);
            console.log(`Provider: ${provider.name} | Model: ${modelDescriptor.name}`);
            console.log(`Task: ${task}\n`);
            logger.info({ task }, "Starting agent loop");
            // Run agent loop
            for await (const event of agentLoop(task, session, provider, toolRegistry)) {
                switch (event.type) {
                    case "delta":
                        // Stream content to console
                        if (typeof event.data === "string") {
                            process.stdout.write(event.data);
                        }
                        break;
                    case "tool_call":
                        // Tool calls are logged by the tool itself
                        break;
                    case "tool_result":
                        // Tool results are logged by the tool itself
                        break;
                    case "complete":
                        console.log("\n\n✅ Task completed");
                        logger.info(event.data, "Agent loop completed");
                        break;
                    case "error":
                        console.error(`\n❌ Error: ${event.data}`);
                        logger.error(event.data, "Agent loop error");
                        break;
                }
            }
            // Show final cost summary
            console.log(`\n💰 Session Cost: $${costTracker.getSessionTotal().toFixed(6)} (${costTracker.getCallCount()} calls)`);
            logger.info({ totalCost: costTracker.getSessionTotal(), callCount: costTracker.getCallCount() }, "Session completed");
            process.exit(0);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(error, "Fatal error");
        console.error(`\n❌ Fatal error: ${errorMessage}\n`);
        process.exit(1);
    }
});
/**
 * Parse command line arguments and execute
 */
program.parse(process.argv);
// Show help if no arguments provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=main.js.map
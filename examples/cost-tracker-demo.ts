/**
 * CostTracker Demo
 *
 * Demonstrates how to use the CostTracker to track API call costs
 */

import { costTracker } from "../src/cost/tracker.js";

console.log("=== CostTracker Demo ===\n");

// Track a DeepSeek call
console.log("Tracking DeepSeek call:");
costTracker.trackCall("deepseek", "deepseek-v3", 1000, 500);

// Track a Qwen call
console.log("\nTracking Qwen call:");
costTracker.trackCall("qwen", "qwen-turbo", 2000, 1000);

// Track another DeepSeek call
console.log("\nTracking another DeepSeek call:");
costTracker.trackCall("deepseek", "deepseek-v3", 500, 250);

// Get session totals
console.log(`\n=== Session Summary ===`);
console.log(`Total Cost: $${costTracker.getSessionTotal().toFixed(6)}`);
console.log(`Total Calls: ${costTracker.getCallCount()}`);

// Show provider rates
console.log("\n=== Provider Rates ===");
console.log("DeepSeek:", costTracker.getRates("deepseek"));
console.log("Qwen:", costTracker.getRates("qwen"));

// Reset and track new session
console.log("\n=== Resetting for New Session ===");
costTracker.reset();
console.log(`After reset - Total: $${costTracker.getSessionTotal().toFixed(6)}, Calls: ${costTracker.getCallCount()}`);

// Track calls in new session
costTracker.trackCall("deepseek", "deepseek-v3", 10000, 5000);
console.log(`New session - Total: $${costTracker.getSessionTotal().toFixed(6)}, Calls: ${costTracker.getCallCount()}`);

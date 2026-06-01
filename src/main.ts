#!/usr/bin/env node

import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  logger.info('OpenCLI v0.1.0 - Phase 0 Foundation');
  logger.info('Configuration loaded');

  const config = await loadConfig();
  logger.info({ provider: config.provider, model: config.model }, 'Default config');

  console.log('\nOpenCLI is in Phase 0 - foundation setup complete.');
  console.log('Phase 1 will implement the core agent loop and first providers.\n');
}

main().catch((error) => {
  logger.error(error, 'Fatal error');
  process.exit(1);
});

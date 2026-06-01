import pino from 'pino';

let isTest = false;

export function setTestMode(): void {
  isTest = true;
}

export const logger = pino({
  level: process.env.DEBUG ? 'debug' : 'info',
  transport: isTest ? {
    target: 'pino/file',
    options: { destination: '/dev/null' },
  } : undefined,
  base: {},
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export type Logger = typeof logger;

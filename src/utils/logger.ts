import pino from "pino";
import os from "os";

export const logger = pino({
  level: process.env.DEBUG ? "debug" : "info",
  transport:
    process.env.NODE_ENV === "test"
      ? { target: "pino/file", options: { destination: os.devNull } }
      : undefined,
  base: {},
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export type Logger = typeof logger;

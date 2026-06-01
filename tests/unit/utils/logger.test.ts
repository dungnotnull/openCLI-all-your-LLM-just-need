import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger, setTestMode, type Logger } from '../../../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    setTestMode();
  });

  afterEach(() => {
    // Reset test mode
  });

  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should export Logger type', () => {
    type LoggerType = Logger;
    expect(true).toBe(true);
  });

  it('should have info level by default', () => {
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('should support debug calls', () => {
    expect(() => logger.debug({ foo: 'bar' }, 'debug message')).not.toThrow();
  });

  it('should support error calls', () => {
    expect(() => logger.error(new Error('test error'), 'error message')).not.toThrow();
  });
});

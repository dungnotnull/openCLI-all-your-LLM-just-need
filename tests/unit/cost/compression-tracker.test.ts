import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { costTracker } from '../../../src/cost/tracker';
import type { CompressionRecord } from '../../../src/cost/tracker';

describe('CostTracker compression metrics', () => {
  beforeEach(() => {
    // Reset cost tracker before each test
    costTracker.reset();
  });

  afterEach(() => {
    // Clean up after each test
    costTracker.reset();
  });

  describe('trackCompression', () => {
    it('should track a compression event', () => {
      costTracker.trackCompression(1000, 500, 'sliding');

      const history = costTracker.getCompressionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].beforeTokens).toBe(1000);
      expect(history[0].afterTokens).toBe(500);
      expect(history[0].reduction).toBe(500);
      expect(history[0].reductionPercent).toBe(50);
      expect(history[0].mode).toBe('sliding');
    });

    it('should track multiple compression events', () => {
      costTracker.trackCompression(1000, 500, 'sliding');
      costTracker.trackCompression(2000, 1500, 'semantic');

      const history = costTracker.getCompressionHistory();
      expect(history).toHaveLength(2);

      expect(history[0].beforeTokens).toBe(1000);
      expect(history[1].beforeTokens).toBe(2000);
    });

    it('should calculate reduction percentage correctly', () => {
      costTracker.trackCompression(1000, 750, 'adaptive');

      const history = costTracker.getCompressionHistory();
      expect(history[0].reductionPercent).toBe(25);
    });

    it('should handle zero reduction gracefully', () => {
      costTracker.trackCompression(1000, 1000, 'sliding');

      const history = costTracker.getCompressionHistory();
      expect(history[0].reduction).toBe(0);
      expect(history[0].reductionPercent).toBe(0);
    });

    it('should handle zero before tokens gracefully', () => {
      costTracker.trackCompression(0, 0, 'semantic');

      const history = costTracker.getCompressionHistory();
      expect(history[0].reductionPercent).toBe(0);
    });
  });

  describe('getTotalTokensSaved', () => {
    it('should return zero when no compressions tracked', () => {
      expect(costTracker.getTotalTokensSaved()).toBe(0);
    });

    it('should sum tokens saved across all compressions', () => {
      costTracker.trackCompression(1000, 500, 'sliding'); // Saves 500
      costTracker.trackCompression(2000, 1500, 'semantic'); // Saves 500
      costTracker.trackCompression(3000, 2000, 'adaptive'); // Saves 1000

      expect(costTracker.getTotalTokensSaved()).toBe(2000);
    });

    it('should handle compression with no savings', () => {
      costTracker.trackCompression(1000, 1000, 'sliding');

      expect(costTracker.getTotalTokensSaved()).toBe(0);
    });
  });

  describe('getCompressionCount', () => {
    it('should return zero when no compressions tracked', () => {
      expect(costTracker.getCompressionCount()).toBe(0);
    });

    it('should return number of compression events tracked', () => {
      costTracker.trackCompression(1000, 500, 'sliding');
      costTracker.trackCompression(2000, 1500, 'semantic');
      costTracker.trackCompression(3000, 2000, 'adaptive');

      expect(costTracker.getCompressionCount()).toBe(3);
    });
  });

  describe('getCompressionHistory', () => {
    it('should return empty array when no compressions tracked', () => {
      const history = costTracker.getCompressionHistory();
      expect(history).toEqual([]);
    });

    it('should return copy of compression history', () => {
      costTracker.trackCompression(1000, 500, 'sliding');
      costTracker.trackCompression(2000, 1500, 'semantic');

      const history = costTracker.getCompressionHistory();
      expect(history).toHaveLength(2);

      // Modifying the returned array should not affect the tracker
      history.push({
        timestamp: new Date().toISOString(),
        beforeTokens: 0,
        afterTokens: 0,
        reduction: 0,
        reductionPercent: 0,
        mode: 'test',
      });

      expect(costTracker.getCompressionHistory()).toHaveLength(2);
    });

    it('should preserve chronological order', () => {
      costTracker.trackCompression(1000, 500, 'sliding');
      costTracker.trackCompression(2000, 1500, 'semantic');

      const history = costTracker.getCompressionHistory();
      expect(history[0].beforeTokens).toBe(1000);
      expect(history[1].beforeTokens).toBe(2000);
    });
  });

  describe('reset', () => {
    it('should clear compression history', () => {
      costTracker.trackCompression(1000, 500, 'sliding');
      costTracker.trackCompression(2000, 1500, 'semantic');

      expect(costTracker.getCompressionCount()).toBe(2);

      costTracker.reset();

      expect(costTracker.getCompressionCount()).toBe(0);
      expect(costTracker.getTotalTokensSaved()).toBe(0);
      expect(costTracker.getCompressionHistory()).toEqual([]);
    });

    it('should also reset API call tracking', () => {
      costTracker.trackCall('deepseek', 'deepseek-v3', 1000, 500);
      costTracker.trackCompression(1000, 500, 'sliding');

      expect(costTracker.getCallCount()).toBe(1);
      expect(costTracker.getCompressionCount()).toBe(1);

      costTracker.reset();

      expect(costTracker.getCallCount()).toBe(0);
      expect(costTracker.getSessionTotal()).toBe(0);
      expect(costTracker.getCompressionCount()).toBe(0);
    });
  });

  describe('integrated cost and compression tracking', () => {
    it('should track both API calls and compressions independently', () => {
      // Track some API calls
      costTracker.trackCall('deepseek', 'deepseek-v3', 1000, 500);
      costTracker.trackCall('qwen', 'qwen-turbo', 2000, 1000);

      // Track some compressions
      costTracker.trackCompression(10000, 5000, 'sliding');
      costTracker.trackCompression(15000, 10000, 'semantic');

      // Verify both are tracked
      expect(costTracker.getCallCount()).toBe(2);
      expect(costTracker.getCompressionCount()).toBe(2);
      expect(costTracker.getSessionTotal()).toBeGreaterThan(0);
      expect(costTracker.getTotalTokensSaved()).toBeGreaterThan(0);
    });
  });
});

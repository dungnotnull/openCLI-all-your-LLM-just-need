/**
 * Unit tests for CostTracker
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CostTracker } from "../../../src/cost/tracker.js";

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe("trackCall", () => {
    it("should track a single DeepSeek call correctly", () => {
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 500);

      // DeepSeek: 1000 * 0.14/1M + 500 * 0.28/1M = 0.00014 + 0.00014 = 0.00028
      expect(tracker.getSessionTotal()).toBeCloseTo(0.00028, 6);
      expect(tracker.getCallCount()).toBe(1);
    });

    it("should track a single Qwen call correctly", () => {
      tracker.trackCall("qwen", "qwen-turbo", 1000, 500);

      // Qwen: 1000 * 3.0/1M + 500 * 6.0/1M = 0.003 + 0.003 = 0.006
      expect(tracker.getSessionTotal()).toBeCloseTo(0.006, 6);
      expect(tracker.getCallCount()).toBe(1);
    });

    it("should accumulate costs across multiple calls", () => {
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 500);
      tracker.trackCall("deepseek", "deepseek-v3", 2000, 1000);
      tracker.trackCall("qwen", "qwen-turbo", 500, 250);

      // DeepSeek calls: 0.00028 + 0.00056 = 0.00084
      // Qwen call: 0.0015 + 0.0015 = 0.003
      // Total: 0.00384
      expect(tracker.getSessionTotal()).toBeCloseTo(0.00384, 5);
      expect(tracker.getCallCount()).toBe(3);
    });

    it("should handle unknown providers gracefully", () => {
      tracker.trackCall("unknown", "unknown-model", 1000, 500);

      expect(tracker.getSessionTotal()).toBe(0);
      expect(tracker.getCallCount()).toBe(1);
    });
  });

  describe("getSessionTotal", () => {
    it("should return 0 for new tracker", () => {
      expect(tracker.getSessionTotal()).toBe(0);
    });

    it("should return cumulative total", () => {
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 0);
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 0);

      // 2 * (1000 * 0.14/1M) = 0.00028
      expect(tracker.getSessionTotal()).toBeCloseTo(0.00028, 6);
    });
  });

  describe("getCallCount", () => {
    it("should return 0 for new tracker", () => {
      expect(tracker.getCallCount()).toBe(0);
    });

    it("should increment with each call", () => {
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 0);
      expect(tracker.getCallCount()).toBe(1);

      tracker.trackCall("deepseek", "deepseek-v3", 1000, 0);
      expect(tracker.getCallCount()).toBe(2);
    });
  });

  describe("reset", () => {
    it("should reset total and call count", () => {
      tracker.trackCall("deepseek", "deepseek-v3", 1000, 500);
      tracker.reset();

      expect(tracker.getSessionTotal()).toBe(0);
      expect(tracker.getCallCount()).toBe(0);
    });
  });

  describe("getRates", () => {
    it("should return rates for known provider", () => {
      const rates = tracker.getRates("deepseek");
      expect(rates).toBeDefined();
      expect(rates?.inputCostPerMillion).toBe(0.14);
      expect(rates?.outputCostPerMillion).toBe(0.28);
    });

    it("should return undefined for unknown provider", () => {
      const rates = tracker.getRates("unknown");
      expect(rates).toBeUndefined();
    });
  });

  describe("updateRates", () => {
    it("should update rates for a provider", () => {
      tracker.updateRates("deepseek", {
        inputCostPerMillion: 0.2,
        outputCostPerMillion: 0.4,
      });

      tracker.trackCall("deepseek", "deepseek-v3", 1000, 500);

      // New rates: 1000 * 0.2/1M + 500 * 0.4/1M = 0.0002 + 0.0002 = 0.0004
      expect(tracker.getSessionTotal()).toBeCloseTo(0.0004, 6);
    });
  });
});

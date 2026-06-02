import { describe, it, expect } from "vitest";

describe("Type exports", () => {
  it("should export Message type", () => {
    type Message = import("../../src/types").Message;
    expect(true).toBe(true);
  });

  it("should export ModelProvider class", () => {
    type ModelProvider = import("../../src/types").ModelProvider;
    expect(true).toBe(true);
  });

  it("should export Tool class", () => {
    type Tool = import("../../src/types").Tool;
    expect(true).toBe(true);
  });

  it("should export Session interface", () => {
    type Session = import("../../src/types").Session;
    expect(true).toBe(true);
  });

  it("should export CompressionStrategy interface", () => {
    type CompressionStrategy = import("../../src/types").CompressionStrategy;
    expect(true).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { MockProvider, mockModel } from "./fixtures/mock-provider";
import type { Message } from "../../src/types";

describe("MockProvider", () => {
  it("should implement ModelProvider interface", async () => {
    const provider = new MockProvider();

    expect(provider.id).toBe("mock");
    expect(provider.name).toBe("Mock Provider");
    expect(provider.models).toHaveLength(1);
    expect(provider.supportsMCP()).toBe(false);
    expect(provider.supportsTools()).toBe(true);
    expect(provider.maxContextWindow()).toBe(10000);
  });

  it("should stream chat responses", async () => {
    const provider = new MockProvider();
    const messages: Message[] = [{ role: "user", content: "test" }];

    const deltas = [];
    for await (const delta of provider.chat(messages, {})) {
      deltas.push(delta);
    }

    expect(deltas).toHaveLength(2);
    expect(deltas[0].type).toBe("content");
    expect(deltas[0].content).toBe("Mock response");
    expect(deltas[1].type).toBe("done");
  });

  it("should count tokens", async () => {
    const provider = new MockProvider();
    const messages: Message[] = [{ role: "user", content: "test" }];

    const count = await provider.countTokens(messages);
    expect(count).toBe(100);
  });
});

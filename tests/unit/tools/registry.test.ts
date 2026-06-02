/**
 * Unit Tests for ToolRegistry
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry, resetToolRegistry } from "../../../src/tools/registry";
import { Tool, type ToolResult } from "../../../src/types/index";

/**
 * Mock tool for testing
 */
class MockTool extends Tool {
  constructor(
    public name: string,
    public description: string,
    public inputSchema: Record<string, unknown>,
    private returnValue: ToolResult
  ) {
    super();
  }

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    return this.returnValue;
  }
}

describe("ToolRegistry", () => {
  beforeEach(() => {
    // Reset singleton before each test
    resetToolRegistry();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ToolRegistry.getInstance();
      const instance2 = ToolRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should allow resetting the singleton", () => {
      const instance1 = ToolRegistry.getInstance();
      instance1.register(new MockTool("test", "desc", {}, { toolCallId: "1", content: "ok" }));

      const instance2 = resetToolRegistry();
      expect(instance2.listTools()).toHaveLength(0);
      expect(instance2).not.toBe(instance1);
    });
  });

  describe("Tool Registration", () => {
    it("should register a tool", () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test_tool", "A test tool", {}, { toolCallId: "1", content: "ok" });

      registry.register(tool);

      expect(registry.listTools()).toContain("test_tool");
    });

    it("should replace tool with duplicate name", () => {
      const registry = ToolRegistry.getInstance();
      const tool1 = new MockTool("test", "First", {}, { toolCallId: "1", content: "first" });
      const tool2 = new MockTool("test", "Second", {}, { toolCallId: "2", content: "second" });

      registry.register(tool1);
      registry.register(tool2);

      const retrieved = registry.getTool("test");
      expect(retrieved?.description).toBe("Second");
    });

    it("should unregister a tool", () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test", "desc", {}, { toolCallId: "1", content: "ok" });

      registry.register(tool);
      expect(registry.listTools()).toHaveLength(1);

      const removed = registry.unregister("test");
      expect(removed).toBe(true);
      expect(registry.listTools()).toHaveLength(0);
    });

    it("should return false when unregistering non-existent tool", () => {
      const registry = ToolRegistry.getInstance();
      const removed = registry.unregister("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("Schema Discovery", () => {
    it("should return schemas for all registered tools", () => {
      const registry = ToolRegistry.getInstance();
      const tool1 = new MockTool(
        "tool1",
        "First tool",
        { type: "object" },
        { toolCallId: "1", content: "ok" }
      );
      const tool2 = new MockTool(
        "tool2",
        "Second tool",
        { type: "object" },
        { toolCallId: "2", content: "ok" }
      );

      registry.register(tool1);
      registry.register(tool2);

      const schemas = registry.getSchemas();

      expect(schemas).toHaveLength(2);
      expect(schemas[0]).toEqual({
        name: "tool1",
        description: "First tool",
        inputSchema: { type: "object" },
      });
      expect(schemas[1]).toEqual({
        name: "tool2",
        description: "Second tool",
        inputSchema: { type: "object" },
      });
    });

    it("should return empty array when no tools registered", () => {
      const registry = ToolRegistry.getInstance();
      expect(registry.getSchemas()).toEqual([]);
    });
  });

  describe("Tool Execution", () => {
    it("should execute a registered tool", async () => {
      const registry = ToolRegistry.getInstance();
      const expected: ToolResult = { toolCallId: "test-id", content: "executed successfully" };
      const tool = new MockTool("test", "desc", {}, expected);

      registry.register(tool);

      const result = await registry.execute("test", {});

      expect(result.content).toBe("executed successfully");
      expect(result.isError).toBeUndefined();
    });

    it("should throw error when tool not found", async () => {
      const registry = ToolRegistry.getInstance();

      await expect(registry.execute("nonexistent", {})).rejects.toThrow(
        "Tool not found: nonexistent"
      );
    });

    it("should throw error when input is invalid", async () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test", "desc", {}, { toolCallId: "1", content: "ok" });

      registry.register(tool);

      await expect(registry.execute("test", null as any)).rejects.toThrow(
        "Invalid input for tool test"
      );
    });

    it("should handle tool execution errors gracefully", async () => {
      const registry = ToolRegistry.getInstance();

      class FailingTool extends Tool {
        name = "failing";
        description = "A failing tool";
        inputSchema = {};

        async execute(): Promise<ToolResult> {
          throw new Error("Tool execution failed");
        }
      }

      registry.register(new FailingTool());

      const result = await registry.execute("failing", {});

      expect(result.isError).toBe(true);
      expect(result.content).toContain("Tool execution error: Tool execution failed");
    });

    it("should preserve tool call ID from result", async () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test", "desc", {}, { toolCallId: "custom-id", content: "ok" });

      registry.register(tool);

      const result = await registry.execute("test", {});

      expect(result.toolCallId).toBe("custom-id");
    });

    it("should generate tool call ID if not provided", async () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test", "desc", {}, { toolCallId: "", content: "ok" });

      registry.register(tool);

      const result = await registry.execute("test", {});

      expect(result.toolCallId).toMatch(/^tool_\d+_[a-z0-9]+$/);
    });
  });

  describe("Utility Methods", () => {
    it("should list all tool names", () => {
      const registry = ToolRegistry.getInstance();
      registry.register(new MockTool("tool1", "desc1", {}, { toolCallId: "1", content: "ok" }));
      registry.register(new MockTool("tool2", "desc2", {}, { toolCallId: "2", content: "ok" }));

      const names = registry.listTools();

      expect(names).toEqual(expect.arrayContaining(["tool1", "tool2"]));
      expect(names).toHaveLength(2);
    });

    it("should get tool by name", () => {
      const registry = ToolRegistry.getInstance();
      const tool = new MockTool("test", "desc", {}, { toolCallId: "1", content: "ok" });

      registry.register(tool);

      const retrieved = registry.getTool("test");

      expect(retrieved).toBe(tool);
    });

    it("should return undefined for non-existent tool", () => {
      const registry = ToolRegistry.getInstance();

      const retrieved = registry.getTool("nonexistent");

      expect(retrieved).toBeUndefined();
    });

    it("should report tool count", () => {
      const registry = ToolRegistry.getInstance();

      expect(registry.size).toBe(0);

      registry.register(new MockTool("tool1", "desc1", {}, { toolCallId: "1", content: "ok" }));
      expect(registry.size).toBe(1);

      registry.register(new MockTool("tool2", "desc2", {}, { toolCallId: "2", content: "ok" }));
      expect(registry.size).toBe(2);
    });

    it("should clear all tools", () => {
      const registry = ToolRegistry.getInstance();
      registry.register(new MockTool("tool1", "desc1", {}, { toolCallId: "1", content: "ok" }));
      registry.register(new MockTool("tool2", "desc2", {}, { toolCallId: "2", content: "ok" }));

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.listTools()).toHaveLength(0);
    });
  });
});

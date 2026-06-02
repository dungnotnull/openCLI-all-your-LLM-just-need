/**
 * Bash Tool for OpenCLI
 *
 * SECURITY-CRITICAL: This tool executes arbitrary shell commands.
 * Always shows the command to the user before execution and requires confirmation.
 *
 * Per PROJECT-detail.md §4.2.1:
 * - Execute shell commands with optional cwd and env
 * - Show command to user before execution (permission prompt)
 * - Require user confirmation (Y/n) before execution
 * - Capture stdout and stderr
 * - Return combined output
 *
 * Sandbox Mode (optional):
 * - When enabled, commands run in a Docker container for isolation
 * - Provides security by limiting filesystem and network access
 */

import { spawn } from "child_process";
import { Tool, ToolResult } from "../types/index.js";
import { createInterface } from "readline";
import { getSandbox, SandboxTool } from "./sandbox.js";

/**
 * BashTool Input Schema
 */
interface BashInput {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * Bash Tool Class
 *
 * Executes shell commands with user confirmation.
 * Supports optional working directory and environment variables.
 * Can optionally use Docker sandbox for secure isolation.
 */
export class BashTool extends Tool {
  readonly name = "bash";
  readonly description = "Execute shell commands in the terminal";

  private sandboxMode: boolean = false;
  private sandbox: SandboxTool | null = null;

  /**
   * Create a new BashTool
   *
   * @param sandboxMode - Enable Docker sandbox mode for secure command execution
   */
  constructor(sandboxMode: boolean = false) {
    super();
    this.sandboxMode = sandboxMode;
    if (sandboxMode) {
      this.sandbox = getSandbox();
    }
  }

  /**
   * Enable or disable sandbox mode
   */
  setSandboxMode(enabled: boolean): void {
    this.sandboxMode = enabled;
    if (enabled && !this.sandbox) {
      this.sandbox = getSandbox();
    }
  }
  readonly inputSchema = {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
      cwd: {
        type: "string",
        description: "Optional working directory for command execution",
      },
      env: {
        type: "object",
        description: "Optional environment variables to override defaults",
        additionalProperties: { type: "string" },
      },
    },
    required: ["command"],
  };

  /**
   * Execute a shell command with user confirmation
   *
   * @param input - Tool input containing command, optional cwd, and env
   * @returns Tool result with stdout/stderr or error message
   */
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    // Validate and parse input
    const parsed = this.parseInput(input);
    if (!parsed) {
      return {
        toolCallId: this.generateToolCallId(),
        content: "Invalid input: command is required and must be a string",
        isError: true,
      };
    }

    const { command, cwd, env } = parsed;

    // SECURITY: Show command to user before execution
    console.log(`\n[Tool: bash] Executing command:`);
    console.log(`  ${command}`);
    if (cwd) {
      console.log(`  (in directory: ${cwd})`);
    }
    console.log();

    // Request user confirmation
    const confirmed = await this.requestConfirmation();

    if (!confirmed) {
      return {
        toolCallId: this.generateToolCallId(),
        content: "Command execution declined by user",
        isError: true,
      };
    }

    // Execute the command
    try {
      const result = await this.executeCommand(command, cwd, env);
      return {
        toolCallId: this.generateToolCallId(),
        content: result,
        isError: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        toolCallId: this.generateToolCallId(),
        content: `Command execution failed: ${errorMessage}`,
        isError: true,
      };
    }
  }

  /**
   * Parse and validate tool input
   */
  private parseInput(input: Record<string, unknown>): BashInput | null {
    const command = input.command;
    const cwd = input.cwd;
    const env = input.env;

    if (!command || typeof command !== "string") {
      return null;
    }

    return {
      command,
      cwd: cwd && typeof cwd === "string" ? cwd : undefined,
      env: env && typeof env === "object" ? (env as Record<string, string>) : undefined,
    };
  }

  /**
   * Request user confirmation via stdin
   *
   * @returns true if user confirms (Y or empty), false if user declines (n)
   */
  private requestConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question("Execute this command? [Y/n] ", (answer) => {
        rl.close();
        const normalized = answer.trim().toLowerCase();
        // Accept: Y, y, or empty (default yes)
        resolve(normalized === "" || normalized === "y" || normalized === "yes");
      });
    });
  }

  /**
   * Execute command using child_process.spawn or sandbox
   *
   * @param command - Command string to execute
   * @param cwd - Optional working directory
   * @param env - Optional environment variables
   * @returns Combined stdout and stderr output
   */
  private async executeCommand(
    command: string,
    cwd?: string,
    env?: Record<string, string>
  ): Promise<string> {
    // Use sandbox if enabled
    if (this.sandboxMode && this.sandbox) {
      try {
        const result = await this.sandbox.execute({
          command,
          workdir: cwd,
          timeout: 30,
        });
        if (result.isError) {
          throw new Error(result.content);
        }
        return result.content;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Docker is not installed')) {
          // Fall back to regular execution if Docker is not available
          console.warn('[Warning] Docker not available, falling back to regular execution');
          return this.executeCommandDirect(command, cwd, env);
        }
        throw error;
      }
    }

    return this.executeCommandDirect(command, cwd, env);
  }

  /**
   * Execute command directly using child_process.spawn
   *
   * @param command - Command string to execute
   * @param cwd - Optional working directory
   * @param env - Optional environment variables
   * @returns Combined stdout and stderr output
   */
  private executeCommandDirect(
    command: string,
    cwd?: string,
    env?: Record<string, string>
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Parse command into args for proper shell handling
      // On Windows, use cmd.exe; on Unix, use /bin/sh
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const shellFlag = isWindows ? "/c" : "-c";

      const child = spawn(shell, [shellFlag, command], {
        cwd,
        env: env ? { ...process.env, ...env } : process.env,
      });

      let stdout = "";
      let stderr = "";

      if (child.stdout) {
        child.stdout.on("data", (data: Buffer) => {
          stdout += data.toString("utf8");
        });
      }

      if (child.stderr) {
        child.stderr.on("data", (data: Buffer) => {
          stderr += data.toString("utf8");
        });
      }

      child.on("close", (code: number | null) => {
        // Combine stdout and stderr
        const output = this.combineOutput(stdout, stderr, code);
        resolve(output);
      });

      child.on("error", (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Combine stdout and stderr into formatted output
   */
  private combineOutput(stdout: string, stderr: string, exitCode: number | null): string {
    let result = "";

    if (stdout) {
      result += `STDOUT:\n${stdout}`;
    }

    if (stderr) {
      if (result) result += "\n";
      result += `STDERR:\n${stderr}`;
    }

    if (exitCode !== null && exitCode !== 0) {
      if (result) result += "\n";
      result += `Exit code: ${exitCode}`;
    }

    return result || "Command executed with no output";
  }

  /**
   * Generate a unique tool call ID
   */
  private generateToolCallId(): string {
    return `bash_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

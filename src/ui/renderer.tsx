/**
 * Main UI Renderer
 *
 * Ink-based terminal UI renderer for OpenCLI.
 * Coordinates all UI components and handles state updates.
 *
 * NOTE: This file requires Ink (React for terminal) to be installed:
 * npm install ink react @types/react
 */

import type { UIState, UIEvent } from './types.js';
import { defaultTheme } from './theme.js';
import { logger } from '../utils/logger.js';

/**
 * Renderer configuration
 */
export interface RendererConfig {
  noUi: boolean; // Plain text mode for CI/Windows
  debug: boolean; // Show debug info
}

/**
 * Main UI renderer class
 */
export class UIRenderer {
  private config: RendererConfig;
  private state: UIState;
  private renderCallbacks: Array<(state: UIState) => void> = [];

  constructor(config: Partial<RendererConfig> = {}) {
    this.config = {
      noUi: false,
      debug: false,
      ...config,
    };

    this.state = this.initialState();
  }

  /**
   * Get initial state
   */
  private initialState(): UIState {
    return {
      phase: 'idle',
      currentProvider: 'deepseek',
      currentModel: 'deepseek-v3',
      messages: [],
      cost: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
      },
    };
  }

  /**
   * Initialize the renderer
   */
  async initialize(): Promise<void> {
    logger.info({ noUi: this.config.noUi }, 'Initializing UI renderer');

    if (this.config.noUi) {
      logger.info('Running in plain text mode');
      return;
    }

    // TODO: Initialize Ink renderer
    // import { render } from 'ink';
    // import App from './components/App.js';
    //
    // this.inkTree = render(<App state={this.state} />);
  }

  /**
   * Handle UI event
   */
  handleEvent(event: UIEvent): void {
    switch (event.type) {
      case 'message':
        this.state.messages.push({
          role: 'user',
          content: event.content,
        });
        break;

      case 'delta':
        if (event.delta.type === 'content' && event.delta.content) {
          this.state.phase = 'streaming';
          this.state.currentDelta = event.delta.content;
        }
        if (event.delta.type === 'tool_call' && event.delta.toolCall) {
          this.state.phase = 'tool_executing';
          this.state.currentToolCall = event.delta.toolCall;
        }
        break;

      case 'tool_result':
        this.state.messages.push({
          role: 'tool',
          content: event.content,
          toolCallId: event.toolCallId,
        });
        this.state.currentToolCall = undefined;
        this.state.phase = 'thinking';
        break;

      case 'compress':
        this.state.compression = {
          beforeTokens: event.data.beforeTokens,
          afterTokens: event.data.afterTokens,
          reduction: event.data.reduction,
        };
        break;

      case 'cost_update':
        this.state.cost.inputTokens += event.tokens.input;
        this.state.cost.outputTokens += event.tokens.output;
        this.state.cost.totalCost += event.cost;
        break;

      case 'error':
        this.state.phase = 'error';
        break;

      case 'complete':
        this.state.phase = 'complete';
        if (this.state.currentDelta) {
          this.state.messages.push({
            role: 'assistant',
            content: this.state.currentDelta,
          });
          this.state.currentDelta = undefined;
        }
        break;
    }

    this.notifyListeners();
  }

  /**
   * Update provider info
   */
  updateProvider(provider: string, model: string): void {
    this.state.currentProvider = provider;
    this.state.currentModel = model;
    this.notifyListeners();
  }

  /**
   * Register state change listener
   */
  onStateChange(callback: (state: UIState) => void): void {
    this.renderCallbacks.push(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    for (const callback of this.renderCallbacks) {
      callback(this.state);
    }
  }

  /**
   * Get current state
   */
  getState(): UIState {
    return { ...this.state };
  }

  /**
   * Render plain text fallback (for --no-ui mode)
   */
  renderPlainText(): string {
    const lines: string[] = [];

    // Header
    lines.push(`[${this.state.currentProvider}/${this.state.currentModel}]`);

    // Compression info
    if (this.state.compression) {
      lines.push(
        `[Compression: ${this.state.compression.beforeTokens} → ${this.state.compression.afterTokens} tokens (-${this.state.compression.reduction})]`
      );
    }

    // Cost info
    if (this.state.cost.totalCost > 0) {
      lines.push(
        `[Cost: $${this.state.cost.totalCost.toFixed(6)} | ${this.state.cost.inputTokens + this.state.cost.outputTokens} tokens]`
      );
    }

    // Current phase
    switch (this.state.phase) {
      case 'thinking':
        lines.push('[Thinking...]');
        break;
      case 'streaming':
        lines.push('[Streaming...]');
        if (this.state.currentDelta) {
          lines.push(this.state.currentDelta);
        }
        break;
      case 'tool_executing':
        if (this.state.currentToolCall) {
          lines.push(`[Running: ${this.state.currentToolCall.name}]`);
        }
        break;
      case 'error':
        lines.push('[Error occurred]');
        break;
      case 'complete':
        lines.push('[Complete]');
        break;
    }

    return lines.join('\n');
  }

  /**
   * Shutdown the renderer
   */
  shutdown(): void {
    logger.info('Shutting down UI renderer');

    // TODO: Cleanup Ink renderer
    // if (this.inkTree) {
    //   this.inkTree.unmount();
    // }
  }
}

/**
 * Singleton instance
 */
let rendererInstance: UIRenderer | null = null;

/**
 * Get or create renderer instance
 */
export function getRenderer(config?: Partial<RendererConfig>): UIRenderer {
  if (!rendererInstance) {
    rendererInstance = new UIRenderer(config);
  }
  return rendererInstance;
}

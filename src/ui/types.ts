/**
 * UI Types
 *
 * Type definitions for the Ink-based terminal UI.
 */

import type { Delta, Message, ToolCall } from '../types/index.js';

/**
 * UI state for the terminal interface
 */
export interface UIState {
  phase: 'idle' | 'thinking' | 'streaming' | 'tool_executing' | 'complete' | 'error';
  currentProvider: string;
  currentModel: string;
  messages: Message[];
  currentDelta?: string;
  currentToolCall?: ToolCall;
  cost: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  compression?: {
    beforeTokens: number;
    afterTokens: number;
    reduction: number;
  };
  budget?: {
    spent: number;
    limit: number;
    percent: number;
  };
}

/**
 * UI event from user or system
 */
export type UIEvent =
  | { type: 'message'; content: string }
  | { type: 'tool_result'; toolCallId: string; content: string }
  | { type: 'delta'; delta: Delta }
  | { type: 'compress'; data: { beforeTokens: number; afterTokens: number; reduction: number } }
  | { type: 'cost_update'; tokens: { input: number; output: number }; cost: number }
  | { type: 'error'; error: string }
  | { type: 'complete' };

/**
 * UI component props
 */
export interface ComponentProps {
  state: UIState;
  width?: number;
  height?: number;
}

/**
 * Theme colors and tokens
 */
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    muted: string;
    bg: string;
    fg: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borders: {
    rounded: number;
    square: number;
  };
}

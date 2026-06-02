/**
 * ThinkingSpinner Component
 *
 * Animated spinner shown during model inference.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */

import type { ComponentProps } from '../types.js';
import { colors } from '../theme.js';

export interface ThinkingSpinnerProps extends ComponentProps {
  phase: 'thinking' | 'streaming' | 'tool_executing' | 'idle';
  message?: string;
}

/**
 * ThinkingSpinner component
 *
 * Shows: Animated during model inference
 */
export function ThinkingSpinner(props: ThinkingSpinnerProps): string {
  const { phase, message } = props;

  if (phase === 'idle') {
    return '';
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const frame = frames[Math.floor(Date.now() / 100) % frames.length];

  let text = '';
  let color = colors.primary;

  switch (phase) {
    case 'thinking':
      text = message || 'Thinking...';
      break;
    case 'streaming':
      text = message || 'Generating response...';
      color = colors.success;
      break;
    case 'tool_executing':
      text = message || 'Running tool...';
      color = colors.warning;
      break;
  }

  return `${color(`${frame} ${text}`)}`;
}

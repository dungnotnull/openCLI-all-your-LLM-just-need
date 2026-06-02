/**
 * UI Theme
 *
 * Color palette and design tokens for the terminal UI.
 * Professional, warm monochrome aesthetic.
 */

import type { Theme } from './types.js';

/**
 * Default theme for OpenCLI
 */
export const defaultTheme: Theme = {
  colors: {
    // Primary brand color (subtle blue)
    primary: '#60A5FA',

    // Secondary accent
    secondary: '#818CF8',

    // Success states
    success: '#34D399',

    // Warning states
    warning: '#FBBF24',

    // Error states
    error: '#F87171',

    // Muted text
    muted: '#6B7280',

    // Background
    bg: '#111827',

    // Foreground text
    fg: '#F9FAFB',

    // Borders
    border: '#374151',
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  borders: {
    rounded: 4,
    square: 0,
  },
};

/**
 * Get theme value by path
 */
export function getThemeValue(path: string): string {
  const parts = path.split('.');
  let value: any = defaultTheme;

  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      return '';
    }
  }

  return value as string;
}

/**
 * Color utility functions
 */
export const colors = {
  primary: (text: string) => `\x1b[38;2;96;165;250m${text}\x1b[0m`,
  secondary: (text: string) => `\x1b[38;2;129;140;248m${text}\x1b[0m`,
  success: (text: string) => `\x1b[38;2;52;211;153m${text}\x1b[0m`,
  warning: (text: string) => `\x1b[38;2;251;191;36m${text}\x1b[0m`,
  error: (text: string) => `\x1b[38;2;248;113;113m${text}\x1b[0m`,
  muted: (text: string) => `\x1b[38;2;107;114;128m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

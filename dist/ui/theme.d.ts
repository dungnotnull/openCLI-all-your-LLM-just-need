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
export declare const defaultTheme: Theme;
/**
 * Get theme value by path
 */
export declare function getThemeValue(path: string): string;
/**
 * Color utility functions
 */
export declare const colors: {
    primary: (text: string) => string;
    secondary: (text: string) => string;
    success: (text: string) => string;
    warning: (text: string) => string;
    error: (text: string) => string;
    muted: (text: string) => string;
    dim: (text: string) => string;
    bold: (text: string) => string;
};
//# sourceMappingURL=theme.d.ts.map
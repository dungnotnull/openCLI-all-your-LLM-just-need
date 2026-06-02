/**
 * UI Module
 *
 * Terminal user interface for OpenCLI using Ink (React for terminal).
 */
export type { UIState, UIEvent, ComponentProps, Theme, } from './types.js';
export { defaultTheme, getThemeValue, colors } from './theme.js';
export { UIRenderer, getRenderer } from './renderer.js';
export type { RendererConfig } from './renderer.js';
export { CostMeter } from './components/CostMeter.js';
export type { CostMeterProps } from './components/CostMeter.js';
export { ModelBadge } from './components/ModelBadge.js';
export type { ModelBadgeProps } from './components/ModelBadge.js';
export { ThinkingSpinner } from './components/ThinkingSpinner.js';
export type { ThinkingSpinnerProps } from './components/ThinkingSpinner.js';
export { DiffViewer, parseUnifiedDiff, renderDiffLines } from './components/DiffViewer.js';
export type { DiffViewerProps, DiffLine } from './components/DiffViewer.js';
export { BudgetBar, getBudgetStatus, formatBudget } from './components/BudgetBar.js';
export type { BudgetBarProps } from './components/BudgetBar.js';
export { KnowledgePulse, KnowledgeBrief, getKnowledgeIcon } from './components/KnowledgePulse.js';
export type { KnowledgePulseProps } from './components/KnowledgePulse.js';
export { PermissionPrompt, formatCommand, formatContentPreview, createPermissionState, shouldAllowPermission, shouldAllowAll } from './components/PermissionPrompt.js';
export type { PermissionPromptProps, PermissionState } from './components/PermissionPrompt.js';
//# sourceMappingURL=index.d.ts.map
/**
 * UI Module
 *
 * Terminal user interface for OpenCLI using Ink (React for terminal).
 */
// Theme
export { defaultTheme, getThemeValue, colors } from './theme.js';
// Renderer
export { UIRenderer, getRenderer } from './renderer.js';
// Components
export { CostMeter } from './components/CostMeter.js';
export { ModelBadge } from './components/ModelBadge.js';
export { ThinkingSpinner } from './components/ThinkingSpinner.js';
export { DiffViewer, parseUnifiedDiff, renderDiffLines } from './components/DiffViewer.js';
export { BudgetBar, getBudgetStatus, formatBudget } from './components/BudgetBar.js';
export { KnowledgePulse, KnowledgeBrief, getKnowledgeIcon } from './components/KnowledgePulse.js';
export { PermissionPrompt, formatCommand, formatContentPreview, createPermissionState, shouldAllowPermission, shouldAllowAll } from './components/PermissionPrompt.js';
//# sourceMappingURL=index.js.map
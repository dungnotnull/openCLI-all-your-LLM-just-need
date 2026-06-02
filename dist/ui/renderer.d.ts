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
/**
 * Renderer configuration
 */
export interface RendererConfig {
    noUi: boolean;
    debug: boolean;
}
/**
 * Main UI renderer class
 */
export declare class UIRenderer {
    private config;
    private state;
    private renderCallbacks;
    constructor(config?: Partial<RendererConfig>);
    /**
     * Get initial state
     */
    private initialState;
    /**
     * Initialize the renderer
     */
    initialize(): Promise<void>;
    /**
     * Handle UI event
     */
    handleEvent(event: UIEvent): void;
    /**
     * Update provider info
     */
    updateProvider(provider: string, model: string): void;
    /**
     * Register state change listener
     */
    onStateChange(callback: (state: UIState) => void): void;
    /**
     * Notify all listeners of state change
     */
    private notifyListeners;
    /**
     * Get current state
     */
    getState(): UIState;
    /**
     * Render plain text fallback (for --no-ui mode)
     */
    renderPlainText(): string;
    /**
     * Shutdown the renderer
     */
    shutdown(): void;
}
/**
 * Get or create renderer instance
 */
export declare function getRenderer(config?: Partial<RendererConfig>): UIRenderer;
//# sourceMappingURL=renderer.d.ts.map
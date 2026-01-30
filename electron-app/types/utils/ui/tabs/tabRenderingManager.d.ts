export const tabRenderingManager: TabRenderingManager;
export default tabRenderingManager;
/**
 * Tab rendering manager with performance optimizations
 */
declare class TabRenderingManager {
    /** @type {Map<string, CancellationTokenSource>} */
    _activeOperations: Map<string, CancellationTokenSource>;
    /** @type {Map<string, number>} */
    _lastRenderTime: Map<string, number>;
    /** @type {string | null} */
    _currentTab: string | null;
    /** @type {number | null} */
    _tabSwitchDebounceTimer: number | null;
    /** @type {number} */
    TAB_SWITCH_DEBOUNCE_MS: number;
    /** @type {number} */
    MIN_RENDER_INTERVAL_MS: number;
    /**
     * Cancel all active rendering operations
     */
    cancelAllOperations(): void;
    /**
     * Cancel operation for a specific tab
     *
     * @param {string} tabName - Name of tab
     */
    cancelOperation(tabName: string): void;
    /**
     * Execute a rendering operation with cancellation support
     *
     * @param {string} tabName - Name of tab being rendered
     * @param {(
     *     token: import("../../app/async/cancellationToken.js").CancellationToken
     * ) => Promise<any>} operation
     *   - Async operation to execute
     * @param {Object} [options] - Options
     * @param {boolean} [options.skipIfRecent=true] - Skip if rendered recently.
     *   Default is `true`
     * @param {boolean} [options.debounce=true] - Debounce the operation.
     *   Default is `true`
     *
     * @returns {Promise<any>}
     */
    executeRenderOperation(
        tabName: string,
        operation: (
            token: import("../../app/async/cancellationToken.js").CancellationToken
        ) => Promise<any>,
        options?: {
            skipIfRecent?: boolean | undefined;
            debounce?: boolean | undefined;
        }
    ): Promise<any>;
    /**
     * Get current active tab
     *
     * @returns {string | null}
     */
    getCurrentTab(): string | null;
    /**
     * Check if a tab rendering operation is active
     *
     * @param {string} tabName - Name of tab
     *
     * @returns {boolean}
     */
    isOperationActive(tabName: string): boolean;
    /**
     * Notify that tab has been switched away from This cancels any active
     * operations for the previous tab
     *
     * @param {string} oldTab - Previous tab name
     * @param {string} newTab - New tab name
     */
    notifyTabSwitch(oldTab: string, newTab: string): void;
    /**
     * Reset render timing for a tab (forces next render to execute)
     *
     * @param {string} tabName - Name of tab
     */
    resetRenderTime(tabName: string): void;
    /**
     * Set current tab
     *
     * @param {string} tabName - Name of tab
     */
    setCurrentTab(tabName: string): void;
}
import { CancellationTokenSource } from "../../app/async/cancellationToken.js";

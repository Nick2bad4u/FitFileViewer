/**
 * Manages tab-specific rendering with cancellation, debouncing, and lazy
 * loading
 *
 * @file Performance-Optimized Tab Rendering Manager
 */

import {
    CancellationTokenSource,
    isCancellationError,
} from "../../app/async/cancellationToken.js";

/**
 * Tab rendering manager with performance optimizations
 */
class TabRenderingManager {
    constructor() {
        /** @type {Map<string, CancellationTokenSource>} */
        this._activeOperations = new Map();

        /** @type {Map<string, number>} */
        this._lastRenderTime = new Map();

        /** @type {string | null} */
        this._currentTab = null;

        /** @type {number | null} */
        this._tabSwitchDebounceTimer = null;

        /** @type {number} */
        this.TAB_SWITCH_DEBOUNCE_MS = 50; // Short debounce to prevent rapid switching

        /** @type {number} */
        this.MIN_RENDER_INTERVAL_MS = 100; // Minimum time between renders for same tab
    }

    /**
     * Cancel all active rendering operations
     */
    cancelAllOperations() {
        for (const [tabName, source] of this._activeOperations.entries()) {
            console.log(
                `[TabRenderingManager] Cancelling operation for tab: ${tabName}`
            );
            source.cancel();
        }
        this._activeOperations.clear();
    }

    /**
     * Cancel operation for a specific tab
     *
     * @param {string} tabName - Name of tab
     */
    cancelOperation(tabName) {
        const source = this._activeOperations.get(tabName);
        if (source) {
            console.log(
                `[TabRenderingManager] Cancelling operation for tab: ${tabName}`
            );
            source.cancel();
            this._activeOperations.delete(tabName);
        }
    }

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
    async executeRenderOperation(tabName, operation, options = {}) {
        const { debounce = true, skipIfRecent = true } = options;

        // Check if we should skip due to recent render
        if (skipIfRecent) {
            const lastRender = this._lastRenderTime.get(tabName);
            if (
                lastRender &&
                Date.now() - lastRender < this.MIN_RENDER_INTERVAL_MS
            ) {
                console.log(
                    `[TabRenderingManager] Skipping render for ${tabName} - rendered too recently`
                );
                return null;
            }
        }

        // Cancel any existing operation for this tab
        this.cancelOperation(tabName);

        // Create new cancellation token
        const source = new CancellationTokenSource();
        this._activeOperations.set(tabName, source);

        try {
            // Optional debouncing
            if (debounce && this._tabSwitchDebounceTimer !== null) {
                clearTimeout(this._tabSwitchDebounceTimer);
            }

            // Execute operation
            const startTime = performance.now();
            const result = await operation(source.token);
            const duration = performance.now() - startTime;

            // Check if still the current tab
            if (this._currentTab !== tabName) {
                console.log(
                    `[TabRenderingManager] Render completed for ${tabName} but tab is no longer active (switched to ${this._currentTab})`
                );
                return null;
            }

            this._lastRenderTime.set(tabName, Date.now());
            console.log(
                `[TabRenderingManager] Render completed for ${tabName} in ${duration.toFixed(2)}ms`
            );

            return result;
        } catch (error) {
            if (isCancellationError(error)) {
                console.log(
                    `[TabRenderingManager] Render cancelled for tab: ${tabName}`
                );
                return null;
            }
            throw error;
        } finally {
            // Clean up
            if (this._activeOperations.get(tabName) === source) {
                this._activeOperations.delete(tabName);
            }
        }
    }

    /**
     * Get current active tab
     *
     * @returns {string | null}
     */
    getCurrentTab() {
        return this._currentTab;
    }

    /**
     * Check if a tab rendering operation is active
     *
     * @param {string} tabName - Name of tab
     *
     * @returns {boolean}
     */
    isOperationActive(tabName) {
        return this._activeOperations.has(tabName);
    }

    /**
     * Notify that tab has been switched away from This cancels any active
     * operations for the previous tab
     *
     * @param {string} oldTab - Previous tab name
     * @param {string} newTab - New tab name
     */
    notifyTabSwitch(oldTab, newTab) {
        // Cancel operations for old tab if switching away
        if (oldTab && oldTab !== newTab) {
            this.cancelOperation(oldTab);
        }

        this._currentTab = newTab;
    }

    /**
     * Reset render timing for a tab (forces next render to execute)
     *
     * @param {string} tabName - Name of tab
     */
    resetRenderTime(tabName) {
        this._lastRenderTime.delete(tabName);
    }

    /**
     * Set current tab
     *
     * @param {string} tabName - Name of tab
     */
    setCurrentTab(tabName) {
        this._currentTab = tabName;
    }
}

// Create and export singleton
export const tabRenderingManager = new TabRenderingManager();

export default tabRenderingManager;

/**
 * Manages tab-specific rendering with cancellation, debouncing, and lazy
 * loading
 */

import {
    type CancellationToken,
    CancellationTokenSource,
    delay,
    isCancellationError,
} from "../../app/async/cancellationToken.js";
import {
    getTabRenderingManagerRuntime,
    type TabRenderingManagerRuntime,
} from "./tabRenderingManagerRuntime.js";

/** Options controlling tab render operation scheduling. */
export type TabRenderOperationOptions = {
    readonly debounce?: boolean;
    readonly skipIfRecent?: boolean;
};

/** Operation executed by the tab rendering manager. */
export type TabRenderOperation<Result = unknown> = (
    token: CancellationToken
) => Promise<Result> | Result;

function tabRenderingManagerRuntime(): TabRenderingManagerRuntime {
    return getTabRenderingManagerRuntime();
}

/**
 * Tab rendering manager with performance optimizations
 */
class TabRenderingManager {
    private readonly _activeOperations = new Map<
        string,
        CancellationTokenSource
    >();
    private readonly _lastRenderTime = new Map<string, number>();
    private _currentTab: null | string = null;
    private readonly MIN_RENDER_INTERVAL_MS = 100; // Minimum time between renders for same tab
    private readonly TAB_SWITCH_DEBOUNCE_MS = 50; // Short debounce to prevent rapid switching

    /**
     * Cancel all active rendering operations
     */
    cancelAllOperations(): void {
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
     * @param tabName - Name of tab.
     */
    cancelOperation(tabName: string): void {
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
     * @param tabName - Name of tab being rendered.
     * @param operation - Async operation to execute.
     * @param options - Render scheduling options.
     *
     * @returns Operation result, or null when skipped/cancelled/stale.
     *
     * @throws Rethrows non-cancellation errors from the render operation.
     */
    async executeRenderOperation<Result = unknown>(
        tabName: string,
        operation: TabRenderOperation<Result>,
        options: TabRenderOperationOptions = {}
    ): Promise<Result | null> {
        const { debounce = true, skipIfRecent = true } = options;

        // Check if we should skip due to recent render
        if (skipIfRecent) {
            const lastRender = this._lastRenderTime.get(tabName);
            if (
                lastRender &&
                tabRenderingManagerRuntime().dateNow() - lastRender <
                    this.MIN_RENDER_INTERVAL_MS
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
            if (debounce) {
                await delay(this.TAB_SWITCH_DEBOUNCE_MS, source.token);
            }

            // Execute operation
            const startTime = tabRenderingManagerRuntime().performanceNow();
            return this.completeRenderOperation(
                tabName,
                startTime,
                await operation(source.token)
            );
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

    private completeRenderOperation<Result>(
        tabName: string,
        startTime: number,
        result: Result
    ): Result | null {
        const duration =
            tabRenderingManagerRuntime().performanceNow() - startTime;

        // Check if still the current tab
        if (this._currentTab !== tabName) {
            const currentTab = this._currentTab ?? "none";
            console.log(
                `[TabRenderingManager] Render completed for ${tabName} but tab is no longer active (switched to ${currentTab})`
            );
            return null;
        }

        this._lastRenderTime.set(
            tabName,
            tabRenderingManagerRuntime().dateNow()
        );
        console.log(
            `[TabRenderingManager] Render completed for ${tabName} in ${duration.toFixed(2)}ms`
        );

        return result;
    }

    /**
     * Get current active tab
     */
    getCurrentTab(): null | string {
        return this._currentTab;
    }

    /**
     * Check if a tab rendering operation is active
     *
     * @param tabName - Name of tab.
     */
    isOperationActive(tabName: string): boolean {
        return this._activeOperations.has(tabName);
    }

    /**
     * Notify that tab has been switched away from This cancels any active
     * operations for the previous tab
     *
     * @param oldTab - Previous tab name.
     * @param newTab - New tab name.
     */
    notifyTabSwitch(oldTab: null | string, newTab: string): void {
        // Cancel operations for old tab if switching away
        if (oldTab && oldTab !== newTab) {
            this.cancelOperation(oldTab);
        }

        this._currentTab = newTab;
    }

    /**
     * Reset render timing for a tab (forces next render to execute)
     *
     * @param tabName - Name of tab.
     */
    resetRenderTime(tabName: string): void {
        this._lastRenderTime.delete(tabName);
    }

    /**
     * Set current tab
     *
     * @param tabName - Name of tab.
     */
    setCurrentTab(tabName: string): void {
        this._currentTab = tabName;
    }
}

/** Singleton tab rendering manager shared by tab state modules. */
export const tabRenderingManager = new TabRenderingManager();

export default tabRenderingManager;

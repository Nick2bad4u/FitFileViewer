/**
 * Application State Actions and Transitions Higher-level actions that
 * encapsulate common state changes
 */

import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

type ChartData = {
    datasets: unknown;
    meta?: unknown;
};
type ChartOptions = Record<string, unknown>;
type MapCenter = [number, number];
type TableConfig = {
    columns?: unknown;
    data?: unknown;
    isRendered?: boolean;
    options?: Record<string, unknown>;
};
type MiddlewareFn = (
    path: string,
    value: unknown,
    oldValue: unknown,
    options: Record<string, unknown>
) => unknown;
type FitFileStateManagerLike = {
    clearFileState?: () => void;
    handleFileLoaded?: (
        fileData: unknown,
        options: { filePath: string | null; source: string }
    ) => void;
    isLoading?: () => boolean;
    startFileLoading?: (filePath: string) => void;
};
type ClearDataOptions = {
    notificationMessage?: string;
    notify?: boolean;
};

const fitFileStateManagerLike = fitFileStateManager as
    | FitFileStateManagerLike
    | null
    | undefined;

function clearLegacyGlobalData(): void {
    try {
        (globalThis as typeof globalThis & { globalData?: unknown }).globalData =
            null;
    } catch {
        /* Ignore legacy global clear failures. */
    }
}

/**
 * Application state actions - higher-level functions for common state changes
 */
export const AppActions = {
    /**
     * Clear all data and reset to initial state
     */
    clearData(options: ClearDataOptions = {}) {
        if (
            fitFileStateManagerLike &&
            typeof fitFileStateManagerLike.clearFileState === "function"
        ) {
            try {
                fitFileStateManagerLike.clearFileState();
            } catch (error) {
                console.warn(
                    "[AppActions] Failed to clear fit file domain state",
                    error
                );
            }
        }

        setState("globalData", null, { source: "AppActions.clearData" });
        clearLegacyGlobalData();
        setState("currentFile", null, { source: "AppActions.clearData" });
        setState("charts.isRendered", false, {
            source: "AppActions.clearData",
        });
        setState("map.isRendered", false, { source: "AppActions.clearData" });
        setState("tables.isRendered", false, {
            source: "AppActions.clearData",
        });

        console.log("[AppActions] Data cleared");
        if (options.notify !== false) {
            void showNotification(
                options.notificationMessage ?? "Data cleared",
                "info",
            );
        }
    },

    /**
     * Load a new FIT file and update related state
     *
     * @param fileData - Parsed FIT file data.
     * @param filePath - Path to the loaded file.
     */
    loadFile(fileData: unknown, filePath: string | null): void {
        const manager =
            fitFileStateManagerLike &&
            typeof fitFileStateManagerLike.handleFileLoaded === "function"
                ? fitFileStateManagerLike
                : null;

        if (manager) {
            const handleFileLoaded = manager.handleFileLoaded;
            if (typeof handleFileLoaded !== "function") {
                return;
            }
            const normalizedPath =
                typeof filePath === "string" && filePath.length > 0
                    ? filePath
                    : null;

            if (
                normalizedPath &&
                typeof manager.startFileLoading === "function" &&
                typeof manager.isLoading === "function" &&
                !manager.isLoading()
            ) {
                try {
                    manager.startFileLoading(normalizedPath);
                } catch (error) {
                    console.warn(
                        "[AppActions] Failed to start fit file loading state",
                        error
                    );
                }
            }

            try {
                handleFileLoaded(fileData, {
                    filePath: normalizedPath,
                    source: "AppActions.loadFile",
                });
            } catch (error) {
                console.error(
                    "[AppActions] Error delegating file load to fitFileStateManager",
                    error
                );
                void showNotification("Failed to load file", "error");
                setState("isLoading", false, { source: "AppActions.loadFile" });
                throw error;
            }

            return;
        }

        try {
            setState("isLoading", true, { source: "AppActions.loadFile" });

            // Update file-related state
            setState("globalData", fileData, { source: "AppActions.loadFile" });
            setState("currentFile", filePath, {
                source: "AppActions.loadFile",
            });

            // Reset component states
            setState("charts.isRendered", false, {
                source: "AppActions.loadFile",
            });
            setState("map.isRendered", false, {
                source: "AppActions.loadFile",
            });
            setState("tables.isRendered", false, {
                source: "AppActions.loadFile",
            });

            // Update performance metrics
            setState("performance.lastLoadTime", Date.now(), {
                source: "AppActions.loadFile",
            });

            void showNotification("File loaded successfully", "success");
            console.log("[AppActions] File loaded:", filePath);
        } catch (error) {
            console.error("[AppActions] Error loading file:", error);
            void showNotification("Failed to load file", "error");
            throw error;
        } finally {
            setState("isLoading", false, { source: "AppActions.loadFile" });
        }
    },

    /**
     * Update chart rendering state and options
     *
     * @param chartData - Chart data.
     * @param options - Chart options.
     */
    renderChart(chartData: ChartData, options: ChartOptions = {}) {
        const startTime = performance.now();

        updateState(
            "charts",
            {
                chartData,
                chartOptions: options,
                isRendered: true,
            },
            { source: "AppActions.renderChart" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                chart: renderTime,
            },
            { source: "AppActions.renderChart" }
        );

        console.log(
            `[AppActions] Chart rendered in ${renderTime.toFixed(2)}ms`
        );
    },

    /**
     * Update map rendering state and center
     *
     * @param center - [lat, lng] coordinates for map center.
     * @param zoom - Zoom level.
     */
    renderMap(center: MapCenter, zoom = 13) {
        const startTime = performance.now();

        updateState(
            "map",
            {
                center,
                isRendered: true,
                zoom,
            },
            { source: "AppActions.renderMap" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                map: renderTime,
            },
            { source: "AppActions.renderMap" }
        );

        console.log(`[AppActions] Map rendered in ${renderTime.toFixed(2)}ms`);
    },

    /**
     * Update table rendering state
     *
     * @param tableConfig - Table configuration.
     */
    renderTable(tableConfig: TableConfig = {}) {
        const startTime = performance.now();

        updateState(
            "tables",
            {
                isRendered: true,
                ...tableConfig,
            },
            { source: "AppActions.renderTable" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                table: renderTime,
            },
            { source: "AppActions.renderTable" }
        );

        console.log(
            `[AppActions] Table rendered in ${renderTime.toFixed(2)}ms`
        );
    },

    /**
     * Select a lap on the map
     *
     * @param lapNumber - Lap number to select (0-based).
     */
    selectLap(lapNumber: number) {
        setState("map.selectedLap", lapNumber, {
            source: "AppActions.selectLap",
        });
        console.log(`[AppActions] Selected lap: ${lapNumber}`);
    },

    /**
     * Set file opening state
     *
     * @param isOpening - Whether a file is being opened.
     */
    setFileOpening(isOpening: boolean) {
        setState("app.isOpeningFile", isOpening, {
            source: "AppActions.setFileOpening",
        });
        console.log(`[AppActions] File opening state: ${String(isOpening)}`);
    },

    /**
     * Set application initialization state
     *
     * @param initialized - Whether the app is initialized.
     */
    setInitialized(initialized: boolean) {
        setState("app.initialized", initialized, {
            source: "AppActions.setInitialized",
        });
        console.log(
            `[AppActions] App initialization state: ${String(initialized)}`
        );
    },

    /**
     * Switch to a different tab
     *
     * @param tabName - Name of the tab to switch to.
     */
    switchTab(tabName: string) {
        const validTabs = [
            "summary",
            "chart",
            "map",
            "table",
        ];

        if (!validTabs.includes(tabName)) {
            console.warn(`[AppActions] Invalid tab name: ${tabName}`);
            return;
        }

        setState("ui.activeTab", tabName, { source: "AppActions.switchTab" });
        console.log(`[AppActions] Switched to tab: ${tabName}`);
    },

    /**
     * Toggle theme between light, dark, and system
     *
     * @param theme - Theme to switch to ('light', 'dark', 'system').
     */
    switchTheme(theme: string) {
        const validThemes = [
            "light",
            "dark",
            "system",
        ];

        if (!validThemes.includes(theme)) {
            console.warn(`[AppActions] Invalid theme: ${theme}`);
            return;
        }

        setState("ui.theme", theme, { source: "AppActions.switchTheme" });
        console.log(`[AppActions] Theme switched to: ${theme}`);
    },

    /**
     * Toggle chart controls visibility
     */
    toggleChartControls() {
        const currentState = getState("charts.controlsVisible");
        setState("charts.controlsVisible", !currentState, {
            source: "AppActions.toggleChartControls",
        });
        console.log(
            `[AppActions] Chart controls ${currentState ? "hidden" : "shown"}`
        );
    },

    /**
     * Toggle map measurement mode
     */
    toggleMeasurementMode() {
        const currentState = getState("map.measurementMode");
        setState("map.measurementMode", !currentState, {
            source: "AppActions.toggleMeasurementMode",
        });
        console.log(
            `[AppActions] Measurement mode ${currentState ? "disabled" : "enabled"}`
        );
    },

    /**
     * Update window state
     *
     * @param windowState - Window state object.
     */
    updateWindowState(windowState: Record<string, unknown>) {
        updateState("ui.windowState", windowState, {
            source: "AppActions.updateWindowState",
        });
        console.log("[AppActions] Window state updated:", windowState);
    },
};

/**
 * State selectors - helper functions to get computed state values
 */
export const AppSelectors = {
    /**
     * Get the current active tab
     *
     * @returns Active tab name.
     */
    activeTab() {
        return getState("ui.activeTab") || "summary";
    },

    /**
     * Check if charts are rendered
     *
     * @returns True if charts are rendered.
     */
    areChartsRendered() {
        return getState("charts.isRendered") || false;
    },

    /**
     * Check if tables are rendered
     *
     * @returns True if tables are rendered.
     */
    areTablesRendered() {
        return getState("tables.isRendered") || false;
    },

    /**
     * Get current theme
     *
     * @returns Current theme.
     */
    currentTheme() {
        return getState("ui.theme") || "system";
    },

    /**
     * Get chart configuration
     *
     * @returns Chart configuration.
     */
    getChartConfig() {
        return getState("charts") || {};
    },

    /**
     * Get current file path
     *
     * @returns Current file path.
     */
    getCurrentFile() {
        return getState("currentFile");
    },

    /**
     * Get map configuration
     *
     * @returns Map configuration.
     */
    getMapConfig() {
        return getState("map") || {};
    },

    /**
     * Get performance metrics
     *
     * @returns Performance data.
     */
    getPerformanceMetrics() {
        return getState("performance") || {};
    },

    /**
     * Check if any data is loaded
     *
     * @returns True if data is loaded.
     */
    hasData() {
        return getState("globalData") !== null;
    },

    /**
     * Check if app is currently loading
     *
     * @returns True if loading.
     */
    isLoading() {
        return getState("isLoading") || false;
    },

    /**
     * Check if map is rendered
     *
     * @returns True if map is rendered.
     */
    isMapRendered() {
        return getState("map.isRendered") || false;
    },

    /**
     * Check if a specific tab is active
     *
     * @param tabName - Tab name to check.
     *
     * @returns True if tab is active.
     */
    isTabActive(tabName: string) {
        return this.activeTab() === tabName;
    },
};

/**
 * State middleware - functions that can intercept and modify state changes
 */
export class StateMiddleware {
    middlewares: MiddlewareFn[] = [];

    /**
     * Apply all middlewares to a state change
     *
     * @param path - State path.
     * @param value - New value.
     * @param oldValue - Old value.
     * @param options - Options.
     *
     * @returns Potentially modified value.
     */
    apply(
        path: string,
        value: unknown,
        oldValue: unknown,
        options: Record<string, unknown>
    ): unknown {
        let modifiedValue = value;

        for (const middleware of this.middlewares) {
            try {
                const result = middleware(
                    path,
                    modifiedValue,
                    oldValue,
                    options
                );
                if (result !== undefined) {
                    modifiedValue = result;
                }
            } catch (error) {
                console.error("[StateMiddleware] Error in middleware:", error);
            }
        }

        return modifiedValue;
    }

    /**
     * Add middleware function
     *
     * @param middleware - Middleware function.
     */
    use(middleware: MiddlewareFn): void {
        this.middlewares.push(middleware);
    }
}

/**
 * Shared global middleware instance.
 */
export const stateMiddleware = new StateMiddleware();

// Add some default middleware
stateMiddleware.use((path, value, oldValue) => {
    // Log important state changes
    if (path.includes("isRendered") || path === "ui.activeTab") {
        console.log(`[StateMiddleware] ${path} changed:`, {
            newValue: value,
            oldValue,
        });
    }
});

/**
 * Create a lazily evaluated memoized computed value invalidated by
 * dependencies.
 *
 * @typeParam T - Computed value type.
 *
 * @param computeFn - Function to compute the value.
 * @param dependencies - Array of state paths to watch.
 *
 * @returns Function that returns the computed value and exposes cleanup.
 */
export function useComputed<T>(
    computeFn: () => T,
    dependencies: string[] = []
): (() => T) & { cleanup: () => void } {
    let cachedValue: T;
    let isValid = false;

    // Subscribe to dependency changes
    const getComputedValue = () => {
            if (!isValid) {
                cachedValue = computeFn();
                isValid = true;
            }
            return cachedValue;
        },
        unsubscribers = dependencies.map((dep) =>
            subscribe(dep, () => {
                isValid = false;
            })
        );

    // Cleanup function
    getComputedValue.cleanup = () => {
        for (const unsub of unsubscribers) unsub();
    };

    return getComputedValue;
}

/**
 * Hook-like accessor for state values with a setter.
 *
 * @typeParam T - State value type.
 *
 * @param path - State path to watch.
 * @param defaultValue - Default value if state is undefined.
 *
 * @returns Value and setter tuple.
 */
export function useState<T = unknown>(
    path: string,
    defaultValue?: T
): [T, (newValue: T) => void] {
    const currentValue = getState(path) ?? defaultValue,
        setter = (newValue: T) => {
            setState(path, newValue, { source: "useState" });
        };

    return [currentValue as T, setter];
}

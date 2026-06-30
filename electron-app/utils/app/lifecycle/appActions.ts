/**
 * Application State Actions and Transitions Higher-level actions that
 * encapsulate common state changes
 */

import { setActiveFitRawData } from "../../state/domain/activeFitRawDataState.js";
import {
    areRendererTablesRendered,
    getRendererMapState,
    getRendererPerformanceMetrics,
    isRendererMapMeasurementModeEnabled,
    setAppInitialized,
    setAppIsOpeningFile,
    setMapMeasurementMode,
    setMapSelectedLap,
    setRendererTablesRendered,
    updateAppActionWindowState,
    updateRendererMapState,
    updateRendererPerformanceRenderTimes,
    updateRendererTableState,
} from "../../state/domain/appActionsState.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import {
    fitFileStateManager,
    type RawFitData,
} from "../../state/domain/fitFileState.js";
import {
    getRendererCurrentFile,
    setRendererCurrentFile,
} from "../../state/domain/rendererActiveFileState.js";
import {
    getRendererActiveTab,
    isRendererActiveTab,
    isRendererTabName,
    setRendererActiveTab,
} from "../../state/domain/rendererActiveTabState.js";
import { toggleRendererChartControlsVisibleFromStoredState } from "../../state/domain/rendererChartControlsState.js";
import {
    areRendererChartsRendered,
    getRendererChartState,
    setRendererChartsRendered,
    updateRendererChartState,
} from "../../state/domain/rendererChartRenderState.js";
import {
    isRendererLoading,
    setRendererLoading,
} from "../../state/domain/rendererLoadingState.js";
import {
    isRendererMapRendered,
    setRendererMapRendered,
} from "../../state/domain/rendererMapRenderState.js";
import {
    getRendererTheme,
    setRendererTheme,
} from "../../state/domain/rendererThemeState.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    getAppActionsRuntime,
    type AppActionsRuntime,
} from "./appActionsRuntime.js";

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
type ClearDataOptions = {
    notificationMessage?: string;
    notify?: boolean;
};

function toError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}

function appActionsRuntime(): AppActionsRuntime {
    return getAppActionsRuntime();
}

/**
 * Application state actions - higher-level functions for common state changes
 */
export const AppActions = {
    /**
     * Clear all data and reset to initial state
     */
    clearData(options: ClearDataOptions = {}) {
        try {
            fitFileStateManager.clearFileState();
        } catch (error) {
            console.warn(
                "[AppActions] Failed to clear fit file domain state",
                error
            );
        }

        setActiveFitRawData(null, { source: "AppActions.clearData" });
        setRendererCurrentFile(null, { source: "AppActions.clearData" });
        setRendererChartsRendered(false, {
            source: "AppActions.clearData",
        });
        setRendererMapRendered(false, { source: "AppActions.clearData" });
        setRendererTablesRendered(false, {
            source: "AppActions.clearData",
        });

        console.log("[AppActions] Data cleared");
        if (options.notify !== false) {
            void showNotification(
                options.notificationMessage ?? "Data cleared",
                "info"
            );
        }
    },

    /**
     * Load a new FIT file and update related state
     *
     * @param fileData - Parsed FIT file data.
     * @param filePath - Path to the loaded file.
     */
    loadFile(
        fileData: RawFitData | null | undefined,
        filePath: string | null
    ): Promise<void> {
        try {
            const normalizedPath =
                typeof filePath === "string" && filePath.length > 0
                    ? filePath
                    : null;

            if (normalizedPath && !fitFileStateManager.isLoading()) {
                try {
                    fitFileStateManager.startFileLoading(normalizedPath);
                } catch (error) {
                    console.warn(
                        "[AppActions] Failed to start fit file loading state",
                        error
                    );
                }
            }

            fitFileStateManager.handleFileLoaded(fileData, {
                filePath: normalizedPath,
            });
        } catch (error) {
            console.error(
                "[AppActions] Error delegating file load to fitFileStateManager",
                error
            );
            void showNotification("Failed to load file", "error");
            setRendererLoading(false, { source: "AppActions.loadFile" });
            return Promise.reject(toError(error));
        }

        return Promise.resolve();
    },

    /**
     * Update chart rendering state and options
     *
     * @param chartData - Chart data.
     * @param options - Chart options.
     */
    renderChart(chartData: ChartData, options: ChartOptions = {}) {
        const runtime = appActionsRuntime();
        const startTime = runtime.performanceNow();

        updateRendererChartState(
            {
                chartData,
                chartOptions: options,
                isRendered: true,
            },
            { source: "AppActions.renderChart" }
        );

        const renderTime = runtime.performanceNow() - startTime;
        updateRendererPerformanceRenderTimes(
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
        const runtime = appActionsRuntime();
        const startTime = runtime.performanceNow();

        updateRendererMapState(
            {
                center,
                isRendered: true,
                zoom,
            },
            { source: "AppActions.renderMap" }
        );

        const renderTime = runtime.performanceNow() - startTime;
        updateRendererPerformanceRenderTimes(
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
        const runtime = appActionsRuntime();
        const startTime = runtime.performanceNow();

        updateRendererTableState(
            {
                isRendered: true,
                ...tableConfig,
            },
            { source: "AppActions.renderTable" }
        );

        const renderTime = runtime.performanceNow() - startTime;
        updateRendererPerformanceRenderTimes(
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
        setMapSelectedLap(lapNumber, {
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
        setAppIsOpeningFile(isOpening, {
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
        setAppInitialized(initialized, {
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
        if (!isRendererTabName(tabName)) {
            console.warn(`[AppActions] Invalid tab name: ${tabName}`);
            return;
        }

        setRendererActiveTab(tabName, { source: "AppActions.switchTab" });
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

        setRendererTheme(theme, { source: "AppActions.switchTheme" });
        console.log(`[AppActions] Theme switched to: ${theme}`);
    },

    /**
     * Toggle chart controls visibility
     */
    toggleChartControls() {
        const nextState = toggleRendererChartControlsVisibleFromStoredState({
            source: "AppActions.toggleChartControls",
        });
        console.log(
            `[AppActions] Chart controls ${nextState ? "shown" : "hidden"}`
        );
    },

    /**
     * Toggle map measurement mode
     */
    toggleMeasurementMode() {
        const currentState = isRendererMapMeasurementModeEnabled();
        setMapMeasurementMode(!currentState, {
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
        updateAppActionWindowState(windowState, {
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
        return getRendererActiveTab();
    },

    /**
     * Check if charts are rendered
     *
     * @returns True if charts are rendered.
     */
    areChartsRendered() {
        return areRendererChartsRendered();
    },

    /**
     * Check if tables are rendered
     *
     * @returns True if tables are rendered.
     */
    areTablesRendered() {
        return areRendererTablesRendered();
    },

    /**
     * Get current theme
     *
     * @returns Current theme.
     */
    currentTheme() {
        return getRendererTheme();
    },

    /**
     * Get chart configuration
     *
     * @returns Chart configuration.
     */
    getChartConfig() {
        return getRendererChartState() || {};
    },

    /**
     * Get current file path
     *
     * @returns Current file path.
     */
    getCurrentFile() {
        return getRendererCurrentFile();
    },

    /**
     * Get map configuration
     *
     * @returns Map configuration.
     */
    getMapConfig() {
        return getRendererMapState();
    },

    /**
     * Get performance metrics
     *
     * @returns Performance data.
     */
    getPerformanceMetrics() {
        return getRendererPerformanceMetrics();
    },

    /**
     * Check if any data is loaded
     *
     * @returns True if data is loaded.
     */
    hasData() {
        return getActiveFitActivityData().rawData != null;
    },

    /**
     * Check if app is currently loading
     *
     * @returns True if loading.
     */
    isLoading() {
        return isRendererLoading();
    },

    /**
     * Check if map is rendered
     *
     * @returns True if map is rendered.
     */
    isMapRendered() {
        return isRendererMapRendered();
    },

    /**
     * Check if a specific tab is active
     *
     * @param tabName - Tab name to check.
     *
     * @returns True if tab is active.
     */
    isTabActive(tabName: string) {
        return isRendererActiveTab(tabName);
    },
};

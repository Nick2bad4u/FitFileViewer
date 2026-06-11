import {
    getRegisteredChartInstanceCount,
    getRegisteredChartInstances,
} from "./chartInstanceRegistry.js";
import {
    getRegisteredChartDevTools,
    registerChartDevTools,
} from "./chartDevToolsRegistry.js";
import type {
    ChartStateListener,
    ChartStateUpdateOptions,
} from "./renderChartStateAccess.js";
import { getActiveFitChartData } from "../../state/domain/fitChartDataState.js";

interface ChartActionsAccess {
    readonly clearCharts?: unknown;
    readonly requestRerender?: unknown;
}

interface ChartSettingsManagerAccess {
    getFieldVisibility(field: string): unknown;
    getSettings(): unknown;
    setFieldVisibility(field: string, visibility: unknown): unknown;
}

interface ComputedStateAccess {
    get?(key: string): unknown;
    invalidate?(key: string): unknown;
    list?(): unknown;
}

interface PerformanceMonitorAccess {
    getSummary(): unknown;
}

type DebounceFunction = (callback: () => void, delay: number) => () => unknown;
type SetStateFunction = (
    path: string,
    value: unknown,
    options?: ChartStateUpdateOptions
) => unknown;
type SubscribeFunction = (
    path: string,
    callback: ChartStateListener
) => unknown;

interface ChartDevToolsDependencies {
    readonly chartActions: ChartActionsAccess;
    readonly chartPerformanceMonitor: PerformanceMonitorAccess;
    readonly chartSettingsManager: ChartSettingsManagerAccess;
    readonly chartState: unknown;
    readonly debounce: DebounceFunction;
    readonly exportChartsWithState: unknown;
    readonly formatChartFields: readonly string[];
    readonly getChartStatus: unknown;
    readonly getComputedStateManager: () => ComputedStateAccess;
    readonly getState: (path: string) => unknown;
    readonly getStateHistory: () => unknown;
    readonly initializeChartStateManagement: unknown;
    readonly isWindowAvailable: boolean;
    readonly refreshChartsIfNeeded: unknown;
    readonly resetChartNotificationState: unknown;
    readonly setState: SetStateFunction;
    readonly subscribe: SubscribeFunction;
}

function getAllFieldVisibility(
    fields: readonly string[],
    chartSettingsManager: ChartSettingsManagerAccess
): Record<string, string> {
    const result: Record<string, string> = {};
    for (const field of fields) {
        result[field] = formatFieldVisibility(
            chartSettingsManager.getFieldVisibility(field)
        );
    }
    return result;
}

function formatFieldVisibility(value: unknown): string {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }

    return "visible";
}

/**
 * Registers state-aware chart development helpers for typed diagnostics.
 */
export function exposeChartDevTools(
    dependencies: ChartDevToolsDependencies
): void {
    if (!dependencies.isWindowAvailable) {
        return;
    }

    const {
        chartActions,
        chartPerformanceMonitor,
        chartSettingsManager,
        getComputedStateManager,
        getState,
    } = dependencies;

    if (getRegisteredChartDevTools()) {
        return;
    }

    const devTools = {
        actions: chartActions,
        clearCharts: chartActions.clearCharts,
        computed: {
            get: (key: string) => getComputedStateManager().get?.(key),
            invalidate: (key: string) =>
                getComputedStateManager().invalidate?.(key),
            list: () => getComputedStateManager().list?.(),
        },
        dumpState: () => ({
            chartInstances: getRegisteredChartInstanceCount(),
            charts: getState("charts"),
            activeFitChartData: getActiveFitChartData().rawData !== null,
            performance: getState("performance"),
            settings: getState("settings"),
            ui: getState("ui"),
        }),
        exportCharts: dependencies.exportChartsWithState,
        fieldVisibility: {
            get: (field: string) =>
                chartSettingsManager.getFieldVisibility(field),
            getAll: () =>
                getAllFieldVisibility(
                    dependencies.formatChartFields,
                    chartSettingsManager
                ),
            set: (field: string, visibility: unknown) =>
                chartSettingsManager.setFieldVisibility(field, visibility),
        },
        getChartInstances: () => getRegisteredChartInstances(),
        getChartSettings: () => chartSettingsManager.getSettings(),
        getChartState: () => dependencies.chartState,
        getChartStatus: dependencies.getChartStatus,
        getPerformanceMetrics: () => getState("performance"),
        getPerformanceSummary: () => chartPerformanceMonitor.getSummary(),
        getState: (path: string) => getState(path),
        getStateHistory: dependencies.getStateHistory,
        initializeStateManagement: dependencies.initializeChartStateManagement,
        performance: chartPerformanceMonitor,
        refreshCharts: dependencies.refreshChartsIfNeeded,
        requestRerender: chartActions.requestRerender,
        resetNotificationState: dependencies.resetChartNotificationState,
        setState: (path: string, value: unknown) =>
            dependencies.setState(path, value, {
                silent: false,
                source: "dev-tools",
            }),
        settings: chartSettingsManager,
        subscribe: (path: string, callback: ChartStateListener) =>
            dependencies.subscribe(path, callback),
        testDebounce: (delay = 1000) => {
            dependencies.debounce(() => {
                console.log("[ChartJS Dev] Debounce test executed");
            }, delay)();
        },
        testStateSynchronization: () => {
            console.log("[ChartJS Dev] Testing state synchronization...");
            console.log(
                "[ChartJS Dev] State access available for manual testing"
            );
        },
    };

    registerChartDevTools(devTools);

    console.log(
        "[ChartJS] Enhanced development tools registered in chartDevToolsRegistry"
    );
    console.log("[ChartJS] Available commands:", Object.keys(devTools));
}

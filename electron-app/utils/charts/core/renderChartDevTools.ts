import {
    getRegisteredChartInstanceCount,
    getRegisteredChartInstances,
} from "./chartInstanceRegistry.js";
import {
    getRegisteredChartDevTools,
    registerChartDevTools,
    type RegisteredChartDevTools,
} from "./chartDevToolsRegistry.js";
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

interface ChartDevToolsDependencies {
    readonly chartActions: ChartActionsAccess;
    readonly chartPerformanceMonitor: PerformanceMonitorAccess;
    readonly chartSettingsManager: ChartSettingsManagerAccess;
    readonly chartState: unknown;
    readonly debounce: DebounceFunction;
    readonly exportChartsWithState: unknown;
    readonly formatChartFields: readonly string[];
    readonly getActiveTab: () => unknown;
    readonly getChartRenderState: () => unknown;
    readonly getChartStatus: unknown;
    readonly getComputedStateManager: () => ComputedStateAccess;
    readonly getPerformanceMetrics: () => unknown;
    readonly getStateHistory: () => unknown;
    readonly initializeChartStateManagement: unknown;
    readonly isWindowAvailable: boolean;
    readonly refreshChartsIfNeeded: unknown;
    readonly resetChartNotificationState: unknown;
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
    } = dependencies;

    if (getRegisteredChartDevTools()) {
        return;
    }

    const devTools: RegisteredChartDevTools = {
        actions: chartActions,
        clearCharts: chartActions.clearCharts,
        computed: {
            get: (key: string) => getComputedStateManager().get?.(key),
            invalidate: (key: string) =>
                getComputedStateManager().invalidate?.(key),
            list: () => getComputedStateManager().list?.(),
        },
        dumpState: () => ({
            activeTab: dependencies.getActiveTab(),
            chartInstances: getRegisteredChartInstanceCount(),
            charts: dependencies.getChartRenderState(),
            activeFitChartData: getActiveFitChartData().rawData !== null,
            performance: dependencies.getPerformanceMetrics(),
            settings: chartSettingsManager.getSettings(),
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
        getPerformanceMetrics: dependencies.getPerformanceMetrics,
        getPerformanceSummary: () => chartPerformanceMonitor.getSummary(),
        getStateHistory: dependencies.getStateHistory,
        initializeStateManagement: dependencies.initializeChartStateManagement,
        performance: chartPerformanceMonitor,
        refreshCharts: dependencies.refreshChartsIfNeeded,
        requestRerender: chartActions.requestRerender,
        resetNotificationState: dependencies.resetChartNotificationState,
        settings: chartSettingsManager,
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

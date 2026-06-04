import type {
    StateListener,
    StateUpdateOptions,
} from "../../state/core/stateManager.js";

interface ChartActionsAccess {
    readonly clearCharts?: unknown;
    readonly requestRerender?: unknown;
}

interface ChartRuntimeGlobal {
    addHoverEffectsToExistingCharts?: unknown;
    readonly _chartjsInstances?: readonly unknown[];
    __chartjs_dev?: unknown;
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
    options?: StateUpdateOptions
) => unknown;
type SubscribeFunction = (path: string, callback: StateListener) => unknown;

interface ChartDevToolsDependencies {
    readonly addHoverEffectsToExistingCharts: unknown;
    readonly chartActions: ChartActionsAccess;
    readonly chartGlobal: ChartRuntimeGlobal;
    readonly chartPerformanceMonitor: PerformanceMonitorAccess;
    readonly chartSettingsManager: ChartSettingsManagerAccess;
    readonly chartState: unknown;
    readonly debounce: DebounceFunction;
    readonly exportChartsWithState: unknown;
    readonly formatChartFields: readonly string[];
    readonly getChartStatus: unknown;
    readonly getComputedStateManager: () => ComputedStateAccess;
    readonly getState: (path: string) => unknown;
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
 * Exposes state-aware chart development helpers on the runtime global.
 */
export function exposeChartDevTools(
    dependencies: ChartDevToolsDependencies
): void {
    if (!dependencies.isWindowAvailable) {
        return;
    }

    const {
        chartActions,
        chartGlobal,
        chartPerformanceMonitor,
        chartSettingsManager,
        getComputedStateManager,
        getState,
    } = dependencies;

    chartGlobal.addHoverEffectsToExistingCharts =
        dependencies.addHoverEffectsToExistingCharts;

    if (chartGlobal.__chartjs_dev) {
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
            chartInstances: chartGlobal._chartjsInstances?.length || 0,
            charts: getState("charts"),
            globalData: Boolean(getState("globalData")),
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
        getChartInstances: () => chartGlobal._chartjsInstances || [],
        getChartSettings: () => chartSettingsManager.getSettings(),
        getChartState: () => dependencies.chartState,
        getChartStatus: dependencies.getChartStatus,
        getPerformanceMetrics: () => getState("performance"),
        getPerformanceSummary: () => chartPerformanceMonitor.getSummary(),
        getState: (path: string) => getState(path),
        getStateHistory: () => getState("__stateHistory") || [],
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
        subscribe: (path: string, callback: StateListener) =>
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

    chartGlobal.__chartjs_dev = devTools;

    console.log(
        "[ChartJS] Enhanced development tools available at chartGlobal.__chartjs_dev"
    );
    console.log("[ChartJS] Available commands:", Object.keys(devTools));
}

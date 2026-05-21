function getAllFieldVisibility(fields, chartSettingsManager) {
    const result = {};
    for (const field of fields) {
        result[field] = String(
            chartSettingsManager.getFieldVisibility(field) ?? "visible"
        );
    }
    return result;
}
/**
 * Exposes state-aware chart development helpers on the runtime global.
 */
export function exposeChartDevTools(dependencies) {
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
            get: (key) => getComputedStateManager().get?.(key),
            invalidate: (key) => getComputedStateManager().invalidate?.(key),
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
            get: (field) => chartSettingsManager.getFieldVisibility(field),
            getAll: () =>
                getAllFieldVisibility(
                    dependencies.formatChartFields,
                    chartSettingsManager
                ),
            set: (field, visibility) =>
                chartSettingsManager.setFieldVisibility(field, visibility),
        },
        getChartInstances: () => chartGlobal._chartjsInstances || [],
        getChartSettings: () => chartSettingsManager.getSettings(),
        getChartState: () => dependencies.chartState,
        getChartStatus: dependencies.getChartStatus,
        getPerformanceMetrics: () => getState("performance"),
        getPerformanceSummary: () => chartPerformanceMonitor.getSummary(),
        getState: (path) => getState(path),
        getStateHistory: () => getState("__stateHistory") || [],
        initializeStateManagement: dependencies.initializeChartStateManagement,
        performance: chartPerformanceMonitor,
        refreshCharts: dependencies.refreshChartsIfNeeded,
        requestRerender: chartActions.requestRerender,
        resetNotificationState: dependencies.resetChartNotificationState,
        setState: (path, value) =>
            dependencies.setState(path, value, {
                silent: false,
                source: "dev-tools",
            }),
        settings: chartSettingsManager,
        subscribe: (path, callback) => dependencies.subscribe(path, callback),
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

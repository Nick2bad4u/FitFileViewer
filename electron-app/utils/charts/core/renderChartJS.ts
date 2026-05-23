/**
 * Provides comprehensive chart rendering, controls management, and export
 * capabilities for fitness device data visualization in the FitFileViewer
 * application.
 *
 * STATE MANAGEMENT INTEGRATION:
 *
 * - Uses getState() to access chart data and configuration
 * - Updates chart state through setState() for proper reactivity
 * - Integrates with ui and performance state tracking
 * - Provides proper error handling and loading states
 *
 * Features:
 *
 * - Multiple chart types (line, bar, doughnut) with dynamic data binding
 * - Toggleable controls panel with professional UI
 * - Comprehensive export capabilities (PNG, CSV, JSON, clipboard)
 * - Performance monitoring and error handling
 * - Theme-aware styling and responsive design
 * - Accessibility support with ARIA labels
 *
 * Dependencies:
 *
 * - Chart.js library (chartGlobal.Chart)
 * - Chart.js zoom plugin (chartGlobal.ChartZoom)
 */

import { loadSharedConfiguration } from "../../app/initialization/loadSharedConfiguration.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { resourceManager } from "../../app/lifecycle/resourceManager.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
// State management imports
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
import { middlewareManager } from "../../state/core/stateMiddleware.js";
import { DEFAULT_MAX_POINTS } from "../plugins/chartOptionsConfig.js";
import { getRecordValue } from "./renderChartModuleHelpers.js";
import {
    clearDataSettingsSignatureCache,
    ensureDataSettingsSignature as resolveDataSettingsSignature,
} from "./renderChartDataSettingsCache.js";
import { createDebouncedDirectRerender } from "./renderChartDirectRerender.js";
import { createExportChartsWithState } from "./renderChartExportState.js";
import { clearChartLabelsCache } from "./renderChartLabelCache.js";
import { notify } from "./renderChartNotificationHelpers.js";
import { hexToRgba as convertHexToRgba } from "./renderChartColorUtils.js";
import { prewarmChartRenderCaches as prewarmChartRenderCachesImpl } from "./renderChartCachePrewarm.js";
import { initializeChartRuntimeBootstrap } from "./renderChartRuntimeBootstrap.js";
import {
    clearPerformanceSettingsCache,
    resolvePerformanceSettings,
} from "./renderChartPerformanceSettings.js";
import { resolveChartRenderSettings } from "./renderChartRenderSettings.js";
import { chartPerformanceMonitor as chartPerformanceMonitorImpl } from "./renderChartPerformanceMonitor.js";
import {
    clearChartSeriesCache,
    getChartSeriesCacheStats as getSeriesCacheStats,
} from "./renderChartSeriesCache.js";
import {
    ensureProcessNextTick,
    getDebouncedChartStateManager,
    getGlobalChartActions,
    getGlobalChartInstances,
    isChartDebugEnabled,
    isDevelopmentEnvironment,
    isLoadingStateSuppressed,
    isTestEnvironment,
    notifyChartRenderComplete,
    setGlobalChartActions,
} from "./renderChartRuntimeHelpers.js";
import {
    createDataSettingsSignature,
    DATA_SIGNATURE_SOURCES,
} from "./renderChartSettingsSignature.js";
import { getThemeConfigSafe } from "./renderChartThemeHelpers.js";
import { addHoverEffectsToExistingCharts } from "../plugins/addChartHoverEffects.js";
import {
    previousChartState as previousChartStateCompat,
    resetChartNotificationState as resetChartNotificationStateCompat,
    updatePreviousChartState as updatePreviousChartStateCompat,
} from "./renderChartNotificationStateCompat.js";
import {
    addInvalidateChartRenderCacheListener as addCacheInvalidationListener,
    notifyInvalidateChartRenderCacheListeners,
} from "./renderChartCacheInvalidationListeners.js";
import { safeCompleteRendering } from "./renderChartCompletion.js";
import { createChartRenderCacheApi } from "./renderChartCacheApi.js";
import { createChartRenderCacheManager } from "./renderChartCacheManager.js";
import {
    getComputedStateManagerSafe,
    getConvertersSafe,
    getFormatChartFieldsSafe,
    getHoverPluginsSafe,
    getRendererModulesSafe,
    getSettingsStateManagerSafe,
    getSetupZoneDataSafe,
    getShowRenderNotificationSafe,
    getUIStateManagerMaybe,
} from "./renderChartDependencyAccessors.js";
import {
    callGetState,
    callSetState,
    callUpdateState,
    getStateManagerSafe,
} from "./renderChartStateAccess.js";
import { createChartStateView } from "./renderChartStateView.js";
import { createChartStateManagementApi } from "./renderChartStateManagementApi.js";
import { createChartActions } from "./renderChartActions.js";
import { registerChartStartup } from "./renderChartStartup.js";
import { createChartSettingsManager } from "./renderChartSettingsManager.js";
import { getChartStatus as getChartStatusSnapshot } from "./renderChartStatus.js";
import { renderChartErrorPlaceholder } from "./renderChartPlaceholders.js";
import { prepareChartRenderData } from "./renderChartDataReadiness.js";
import { exposeChartDevTools } from "./renderChartDevTools.js";
import { executePreparedChartRender } from "./renderChartPreparedExecution.js";
import {
    createRenderTimingGate,
    RENDER_DEBOUNCE_MS,
} from "./renderChartTiming.js";
import {
    normalizeRenderChartOptions,
    shouldAbortInactiveChartRender,
} from "./renderChartPreflight.js";
import { prepareChartRenderContainer } from "./renderChartContainerSetup.js";
import { beginChartRenderSession } from "./renderChartSessionStart.js";
import { resolveChartFieldRenderPlan } from "./renderChartFieldPlan.js";
import { resolveChartThemeRenderPlan } from "./renderChartThemePlan.js";
import { resolveChartRuntimeDependencies } from "./renderChartRuntimeDependencies.js";
import { renderChartDataCharts } from "./renderChartDataCharts.js";
import { completeChartDataRender } from "./renderChartDataCompletion.js";
import { beginChartDataRenderContext } from "./renderChartDataContext.js";
import type {
    ActivityStartTime,
    ChartDataRecord,
} from "./renderChartDataPreparation.js";

type RenderChartTarget = Element | null | string | undefined;
type RenderChartOptions = {
    allowInactiveTab?: boolean;
    renderMode?: "background" | "foreground";
    skipControls?: boolean;
    skipTabAbort?: boolean;
};
type ChartGlobalWithInstances = typeof chartGlobal & {
    _chartjsInstances: unknown[];
};

function debounceCallback(callback: () => void, delay: number): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return () => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = setTimeout(callback, delay);
    };
}

function getChartGlobalWithInstances(): ChartGlobalWithInstances {
    chartGlobal._chartjsInstances ??= [];
    return chartGlobal as ChartGlobalWithInstances;
}

/** Tracks render timings and exposes chart performance summaries. */
export const chartPerformanceMonitor = chartPerformanceMonitorImpl;

ensureProcessNextTick();

/**
 * Enhanced chart settings management with state integration Provides
 * centralized settings access with reactive updates
 */
export const chartSettingsManager = createChartSettingsManager({
    createDataSettingsSignature,
    dataSignatureSources: DATA_SIGNATURE_SOURCES,
    defaultMaxPoints: DEFAULT_MAX_POINTS,
    getComputedStateManager: getComputedStateManagerSafe,
    getRecordValue,
    getSettingsStateManager: getSettingsStateManagerSafe,
    getState: callGetState,
    invalidateChartRenderCache,
    isRendered: () => chartState.isRendered,
    requestRerender: (reason) => chartActions.requestRerender(reason),
    setState: callSetState,
    updateState: callUpdateState,
});

const renderTimingGate = createRenderTimingGate(RENDER_DEBOUNCE_MS);

// A stable debounced re-render function.
// NOTE: Do NOT create a new debounce() instance per call, or it won't debounce.
const debouncedDirectRerender = createDebouncedDirectRerender({
    getStateManager: getStateManagerSafe,
    isDevelopmentEnvironment,
    renderChart: renderChartJS,
    waitMs: RENDER_DEBOUNCE_MS,
});

const chartRenderCacheManager = createChartRenderCacheManager({
    addInvalidateChartRenderCacheListener: addCacheInvalidationListener,
    clearChartLabelsCache,
    clearChartSeriesCache,
    clearDataSettingsSignatureCache,
    clearPerformanceSettingsCache,
    ensureDataSettingsSignature: resolveDataSettingsSignature,
    getChartSeriesCacheStats: getSeriesCacheStats,
    isDevelopmentEnvironment,
    notifyInvalidateChartRenderCacheListeners,
});

const chartRenderCacheApi = createChartRenderCacheApi({
    chartRenderCacheManager,
    chartSettingsManager,
    prewarmChartRenderCaches: prewarmChartRenderCachesImpl,
});

/** Registers a listener that runs when chart render caches are invalidated. */
export function addInvalidateChartRenderCacheListener(
    listener: Parameters<
        typeof chartRenderCacheApi.addInvalidateChartRenderCacheListener
    >[0]
) {
    return chartRenderCacheApi.addInvalidateChartRenderCacheListener(listener);
}

/** Returns current chart series cache statistics. */
export function getChartSeriesCacheStats() {
    return chartRenderCacheApi.getChartSeriesCacheStats();
}

/** Clears chart render caches for a specific invalidation reason. */
export function invalidateChartRenderCache(reason = "manual") {
    chartRenderCacheApi.invalidateChartRenderCache(reason);
}

/** Prewarms expensive chart render caches for a prospective render. */
export async function prewarmChartRenderCaches(
    params: Parameters<typeof chartRenderCacheApi.prewarmChartRenderCaches>[0]
) {
    return chartRenderCacheApi.prewarmChartRenderCaches(params);
}

const ensureDataSettingsSignature = (settings: unknown): string =>
    chartRenderCacheApi.ensureDataSettingsSignature(settings);

/** Last chart notification state retained for compatibility callers. */
export const previousChartState = previousChartStateCompat;

/** Resets notification tracking for the next chart render. */
export function resetChartNotificationState() {
    return resetChartNotificationStateCompat();
}

/** Updates compatibility tracking for the previous chart render. */
export function updatePreviousChartState(
    chartCount: number,
    visibleFields: number,
    timestamp: number
) {
    return updatePreviousChartStateCompat(chartCount, visibleFields, timestamp);
}

const chartGlobal = initializeChartRuntimeBootstrap({
    getChartStateManager: getDebouncedChartStateManager,
    renderChart: renderChartJS,
});

/** Reactive view over chart state and renderable fields. */
export const chartState = createChartStateView({
    getFieldVisibility: (field) =>
        chartSettingsManager.getFieldVisibility(field),
    getFormatChartFields: getFormatChartFieldsSafe,
    getState: callGetState,
});

/** State-backed chart action handlers exposed to chart integrations. */
export const chartActions = createChartActions({
    appActions: AppActions,
    chartGlobal,
    debouncedDirectRerender,
    getControlsVisible: () => chartState.controlsVisible,
    getDebouncedChartStateManager,
    getPanelVisibilityManager: getUIStateManagerMaybe,
    isLoadingStateSuppressed,
    isRendered: () => chartState.isRendered,
    notifyChartRenderComplete,
    setState: callSetState,
    updateState: callUpdateState,
});

const chartStateManagementApi = createChartStateManagementApi({
    chartActions,
    chartState,
    getComputedStateManager: getComputedStateManagerSafe,
    getState,
    middlewareManager,
    notify,
    updateState,
});

registerChartStartup({
    chartActions,
    chartGlobal,
    loadSharedConfiguration,
    setGlobalChartActions,
});

/** Exports rendered chart artifacts using current state. */
export const exportChartsWithState = createExportChartsWithState({
    chartGlobal,
    getChartInstances: getGlobalChartInstances,
    getState,
    notify,
    setState,
});

/** Returns the current public chart-rendering status snapshot. */
export function getChartStatus() {
    return getChartStatusSnapshot({ chartState, getState });
}

/**
 * Converts a hex color token to an rgba string.
 *
 * @param hex - Hex color code.
 * @param alpha - Alpha transparency value.
 *
 * @returns RGBA color string.
 */
export function hexToRgba(hex: string, alpha: number): string {
    return convertHexToRgba(hex, alpha);
}

/**
 * Initialize chart state management integration Sets up reactive subscriptions
 * and state synchronization Call this during application startup
 */
export function initializeChartStateManagement() {
    return chartStateManagementApi.initializeChartStateManagement();
}

/**
 * State-aware chart refresh function Triggers re-render only if conditions are
 * met
 */
export function refreshChartsIfNeeded() {
    return chartStateManagementApi.refreshChartsIfNeeded();
}

/**
 * Main chart rendering function with state management integration and
 * comprehensive error handling
 *
 * @param targetContainer - Optional container element or ID for chart
 *   rendering.
 * @param options - Render-mode and inactive-tab controls.
 *
 * @returns Success status of the rendering operation.
 */
export async function renderChartJS(
    targetContainer: RenderChartTarget = undefined,
    options: RenderChartOptions = {}
): Promise<boolean> {
    console.log("[ChartJS] Starting chart rendering...");

    const { allowInactiveTab, skipTabAbort, skipControls } =
        normalizeRenderChartOptions(options);

    if (
        shouldAbortInactiveChartRender(
            {
                getStateManager: getStateManagerSafe,
                isTestEnvironment,
                log: (message) => console.log(message),
            },
            allowInactiveTab
        )
    ) {
        return false;
    }

    try {
        const renderSession = await beginChartRenderSession(
            {
                chartGlobal,
                doc: document,
                getGlobalChartActions,
                isLoadingStateSuppressed,
                notify,
                now: () => performance.now(),
                safeCompleteRendering,
                setState: callSetState,
                updateState: callUpdateState,
                waitIfRapidRender: () => renderTimingGate.waitIfRapidRender(),
            },
            { targetContainer }
        );
        if (!renderSession.ready) {
            return false;
        }
        const { performanceStart } = renderSession;

        const preparedData = await prepareChartRenderData(
            {
                doc: document,
                getConverters: getConvertersSafe,
                getSetupZoneData: getSetupZoneDataSafe,
                getState: callGetState,
                getStateManager: getStateManagerSafe,
                getThemeConfig: getThemeConfigSafe,
                notify,
                safeCompleteRendering,
            },
            { targetContainer }
        );
        if (!preparedData.ready) {
            return false;
        }
        const { activityStartTime, recordMesgs } = preparedData;

        const { success } = await executePreparedChartRender(
            {
                chartGlobal,
                createElement: (tagName) => document.createElement(tagName),
                getGlobalChartActions,
                getRendererModules: getRendererModulesSafe,
                isTestEnvironment,
                now: () => performance.now(),
                renderChartsWithData: (
                    target,
                    messages,
                    activityStart,
                    renderOptions
                ) =>
                    renderChartsWithData(
                        target as RenderChartTarget,
                        messages,
                        activityStart,
                        renderOptions
                    ),
                safeCompleteRendering,
                warn: (message, error) => console.warn(message, error),
            },
            {
                activityStartTime,
                performanceStart,
                recordMesgs,
                targetContainer,
            },
            {
                allowInactiveTab,
                skipControls,
                skipTabAbort,
            }
        );
        return success;
    } catch (error) {
        console.error("[ChartJS] Critical error in chart rendering:", error);
        await notify("Failed to render charts due to an error", "error");

        // Handle error through state actions
        safeCompleteRendering(false);

        await renderChartErrorPlaceholder(
            { doc: document, getThemeConfig: getThemeConfigSafe },
            targetContainer,
            error
        );
        return false;
    }
}

/**
 * Renders charts with validated FIT record data.
 *
 * @param targetContainer - Container element or selector for charts.
 * @param recordMesgs - FIT file record messages.
 * @param startTime - Activity start time used for label generation.
 * @param options - Controls render loop behavior.
 *
 * @returns Success status.
 */
async function renderChartsWithData(
    targetContainer: RenderChartTarget,
    recordMesgs: readonly ChartDataRecord[],
    startTime: ActivityStartTime,
    options: Pick<RenderChartOptions, "skipControls" | "skipTabAbort"> = {}
): Promise<boolean> {
    const {
        isDebugLoggingEnabled,
        isTestRuntime,
        renderStartTime,
        skipControls,
        skipTabAbort,
    } = beginChartDataRenderContext(
        {
            doc: document,
            isChartDebugEnabled,
            isDevelopmentEnvironment,
            isTestEnvironment,
            nowPerformance: () => performance.now(),
        },
        options
    );

    const {
        addChartHoverEffectsSafe,
        addHoverEffectsToExistingChartsSafe,
        convert,
        createChartCanvasSafe,
        createEnhancedChartSafe,
        gs_rcwd,
        removeChartHoverEffectsSafe,
        renderEventMessagesChartSafe,
        renderGPSTimeChartSafe,
        renderGPSTrackChartSafe,
        renderLapZoneChartsSafe,
        renderPerformanceAnalysisChartsSafe,
        renderTimeInZoneChartsSafe,
        showRenderNotificationSafe,
        ss_rcwd,
        themeConfig,
        us_rcwd,
    } = await resolveChartRuntimeDependencies({
        getConverters: getConvertersSafe,
        getHoverPlugins: getHoverPluginsSafe,
        getRendererModules: getRendererModulesSafe,
        getShowRenderNotification: getShowRenderNotificationSafe,
        getStateManager: getStateManagerSafe,
        getThemeConfig: getThemeConfigSafe,
    });

    const chartContainer = prepareChartRenderContainer(
        {
            doc: document,
            removeChartHoverEffects: removeChartHoverEffectsSafe,
        },
        { skipControls, targetContainer }
    );

    const {
        animationStyle,
        boolSettings,
        chartType,
        customColors,
        dataSettingsSignature,
        distanceUnits,
        exportTheme,
        interpolation,
        normalizedMaxPoints,
        performanceTuning,
        smoothing,
        temperatureUnits,
        timeUnits,
    } = resolveChartRenderSettings(
        {
            defaultMaxPoints: DEFAULT_MAX_POINTS,
            ensureDataSettingsSignature,
            getSettings: () => chartSettingsManager.getSettings(),
            resolvePerformanceSettings,
            setChartOptionsState: ss_rcwd,
        },
        { recordCount: recordMesgs.length }
    );

    const { zoomPluginConfig } = resolveChartThemeRenderPlan({
        isDebugLoggingEnabled,
        themeConfig,
    });

    // Process data using memoization helpers to avoid redundant conversions across renders
    const { effectiveAnimationStyle, fieldsToRender, labels } =
        resolveChartFieldRenderPlan({
            animationStyle,
            isDebugLoggingEnabled,
            recordMesgs,
            renderableFields: chartState.renderableFields,
            startTime,
        });

    const chartDataRenderResult = renderChartDataCharts(
        {
            chartContainer,
            chartGlobal: getChartGlobalWithInstances(),
            createChartCanvas: createChartCanvasSafe,
            createEnhancedChart: createEnhancedChartSafe,
            getActiveTab: () => gs_rcwd("ui.activeTab"),
            getFieldVisibility: (field) =>
                chartSettingsManager.getFieldVisibility(field),
            isDebugLoggingEnabled,
            isTestRuntime,
            registerChart: (chart) =>
                resourceManager.registerChart(chart, {
                    owner: "renderChartJS",
                }),
            renderers: {
                renderEventMessagesChart: renderEventMessagesChartSafe,
                renderGPSTimeChart: renderGPSTimeChartSafe,
                renderGPSTrackChart: renderGPSTrackChartSafe,
                renderLapZoneCharts: renderLapZoneChartsSafe,
                renderPerformanceAnalysisCharts: (
                    container,
                    data,
                    chartLabels,
                    rendererOptions
                ) =>
                    renderPerformanceAnalysisChartsSafe(
                        container,
                        [...data],
                        [...chartLabels],
                        rendererOptions as Parameters<
                            typeof renderPerformanceAnalysisChartsSafe
                        >[3]
                    ),
                renderTimeInZoneCharts: renderTimeInZoneChartsSafe,
            },
            skipTabAbort,
        },
        {
            animationStyle: effectiveAnimationStyle,
            boolSettings,
            chartType,
            convert,
            customColors,
            dataSettingsSignature,
            distanceUnits,
            exportTheme,
            fieldsToRender,
            interpolation,
            labels,
            normalizedMaxPoints,
            performanceTuning,
            recordMesgs,
            smoothing,
            startTime,
            temperatureUnits,
            timeUnits,
            zoomPluginConfig,
        }
    );
    if (chartDataRenderResult.aborted) {
        return false;
    }

    await completeChartDataRender(
        {
            addChartHoverEffects: addChartHoverEffectsSafe,
            addHoverEffectsToExistingCharts:
                addHoverEffectsToExistingChartsSafe,
            chartContainer,
            chartGlobal: getChartGlobalWithInstances(),
            CustomEventConstructor: globalThis.CustomEvent,
            doc: document,
            getComputedStateManager: getComputedStateManagerSafe,
            getState: gs_rcwd,
            getThemeConfig: getThemeConfigSafe,
            getUIStateManager: getUIStateManagerMaybe,
            isTestRuntime,
            notify,
            now: Date.now,
            nowPerformance: () => performance.now(),
            showRenderNotification: showRenderNotificationSafe,
            updatePreviousChartState,
            updateState: us_rcwd,
        },
        {
            renderStartTime,
            visibleFieldCount: chartDataRenderResult.visibleFieldCount,
        }
    );

    return true;
}

exposeChartDevTools({
    addHoverEffectsToExistingCharts,
    chartActions,
    chartGlobal,
    chartPerformanceMonitor,
    chartSettingsManager,
    chartState,
    debounce: (callback, delay) => debounceCallback(callback, delay),
    exportChartsWithState,
    formatChartFields,
    getChartStatus,
    getComputedStateManager: getComputedStateManagerSafe,
    getState,
    initializeChartStateManagement,
    isWindowAvailable: globalThis.window !== undefined,
    refreshChartsIfNeeded,
    resetChartNotificationState,
    setState,
    subscribe,
});

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
 *
 * @file Enhanced Chart.js rendering utility with State Management Integration
 */

import { loadSharedConfiguration } from "../../app/initialization/loadSharedConfiguration.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { resourceManager } from "../../app/lifecycle/resourceManager.js";
import {
    fieldLabels,
    formatChartFields,
} from "../../formatting/display/formatChartFields.js";
// State management imports
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
import { middlewareManager } from "../../state/core/stateMiddleware.js";
import { DEFAULT_MAX_POINTS } from "../plugins/chartOptionsConfig.js";
import { renderNoDataMessage, safeAppend } from "./renderChartDomHelpers.js";
import {
    clearDataSettingsSignatureCache,
    ensureDataSettingsSignature as resolveDataSettingsSignature,
} from "./renderChartDataSettingsCache.js";
import { handleChartRenderNotification } from "./renderChartNotificationFlow.js";
import {
    getInjectedModule,
    getRecordFunction,
    getRecordValue,
} from "./renderChartModuleHelpers.js";
import { createDebouncedDirectRerender } from "./renderChartDirectRerender.js";
import { createExportChartsWithState } from "./renderChartExportState.js";
import {
    clearChartLabelsCache,
    getLabelsForRecords,
} from "./renderChartLabelCache.js";
import { applyCompletedChartHoverEffects } from "./renderChartHoverCompletion.js";
import { notify } from "./renderChartNotificationHelpers.js";
import { hexToRgba as convertHexToRgba } from "./renderChartColorUtils.js";
import { normalizeMaxPointsValue } from "./renderChartPointUtils.js";
import { prewarmChartRenderCaches as prewarmChartRenderCachesImpl } from "./renderChartCachePrewarm.js";
import { initializeChartRuntimeBootstrap } from "./renderChartRuntimeBootstrap.js";
import {
    clearPerformanceSettingsCache,
    resolvePerformanceSettings,
    shouldUseSpanGaps,
} from "./renderChartPerformanceSettings.js";
import { chartPerformanceMonitor as chartPerformanceMonitorImpl } from "./renderChartPerformanceMonitor.js";
import { updateChartRenderPerformanceState } from "./renderChartPerformanceState.js";
import { resolveChartAnimationTuning } from "./renderChartAnimationTuning.js";
import {
    clearChartSeriesCache,
    getCachedSeriesForSettings,
    getFieldSeriesEntry,
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
// Chart utility imports
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
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
import {
    clearExistingCharts,
    completeChartRendering,
    startChartRendering,
} from "./renderChartLifecycle.js";
import { runChartRender } from "./renderChartExecution.js";
import {
    renderChartErrorPlaceholder,
    renderNoChartDataPlaceholder,
} from "./renderChartPlaceholders.js";
import {
    getActivityStartTime,
    getRecordMessages,
    isChartDataObject,
    storeChartData,
} from "./renderChartDataPreparation.js";
import { exposeChartDevTools } from "./renderChartDevTools.js";
import { touchChartRenderDependencies } from "./renderChartDependencyTouches.js";
import { touchRendererModulesForTest } from "./renderChartTestRendererTouches.js";
import {
    createRenderTimingGate,
    RENDER_DEBOUNCE_MS,
} from "./renderChartTiming.js";
import {
    isChartLibraryUnavailable,
    normalizeRenderChartOptions,
    shouldAbortInactiveChartRender,
    touchStringTargetContainer,
} from "./renderChartPreflight.js";
import { completeChartRenderState } from "./renderChartCompletionState.js";
import { emitChartsRenderedEvent } from "./renderChartRenderedEvent.js";
import { prepareChartRenderContainer } from "./renderChartContainerSetup.js";
import { resolveRenderableChartFields } from "./renderChartFieldSelection.js";
import { resolveChartRenderResultState } from "./renderChartResultState.js";
import { renderSupplementalCharts } from "./renderChartSupplementalCharts.js";
import { createChartZoomPluginConfig } from "./renderChartZoomConfig.js";

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

export function addInvalidateChartRenderCacheListener(listener) {
    return chartRenderCacheApi.addInvalidateChartRenderCacheListener(
        listener
    );
}

export function getChartSeriesCacheStats() {
    return chartRenderCacheApi.getChartSeriesCacheStats();
}

export function invalidateChartRenderCache(reason = "manual") {
    chartRenderCacheApi.invalidateChartRenderCache(reason);
}

export async function prewarmChartRenderCaches(params) {
    return chartRenderCacheApi.prewarmChartRenderCaches(params);
}

const ensureDataSettingsSignature = (settings) =>
    chartRenderCacheApi.ensureDataSettingsSignature(settings);

export const previousChartState = previousChartStateCompat;

export function resetChartNotificationState() {
    return resetChartNotificationStateCompat();
}

export function updatePreviousChartState(chartCount, visibleFields, timestamp) {
    return updatePreviousChartStateCompat(
        chartCount,
        visibleFields,
        timestamp
    );
}

const chartGlobal = initializeChartRuntimeBootstrap({
    getChartStateManager: getDebouncedChartStateManager,
    renderChart: renderChartJS,
});

/**
 * Creates an enhanced settings and control panel for charts
 *
 * @param {HTMLElement | string} targetContainer - Container element or ID
 *
 * @returns {Object} Current settings object
 */
export const chartState = createChartStateView({
    getFieldVisibility: (field) =>
        chartSettingsManager.getFieldVisibility(field),
    getFormatChartFields: getFormatChartFieldsSafe,
    getInjectedModule,
    getRecordFunction,
    getRecordValue,
    getState: callGetState,
});

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

export const exportChartsWithState = createExportChartsWithState({
    chartGlobal,
    getChartInstances: getGlobalChartInstances,
    getState,
    notify,
    setState,
});

export function getChartStatus() {
    return getChartStatusSnapshot({ chartState, getState });
}

// Utility function to convert hex to rgba.
/**
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha transparency value
 *
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha) {
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
 * Process and set up zone data from FIT file for chart rendering Extracts time
 * in zone data from session messages and sets global variables
 */
/**
 * Main chart rendering function with state management integration and
 * comprehensive error handling
 *
 * @param {Element | string} [targetContainer] - Optional container element or
 *   ID for chart rendering. If omitted, defaults to '#content_chart'.
 * @param {{
 *     allowInactiveTab?: boolean;
 *     skipTabAbort?: boolean;
 *     skipControls?: boolean;
 *     renderMode?: "foreground" | "background";
 * }} [options]
 *
 * @returns {Promise<boolean>} Success status of the rendering operation
 */
export async function renderChartJS(targetContainer, options = {}) {
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
        touchStringTargetContainer(document, targetContainer);

        startChartRendering({
            getGlobalChartActions,
            isLoadingStateSuppressed,
            setState: callSetState,
        });

        await renderTimingGate.waitIfRapidRender();

        const performanceStart = performance.now();

        // Initialize chart instances array
        if (!chartGlobal._chartjsInstances) {
            chartGlobal._chartjsInstances = [];
        }

        clearExistingCharts({
            chartGlobal,
            getGlobalChartActions,
            updateState: callUpdateState,
        });

        // Validate Chart.js availability
        if (isChartLibraryUnavailable(chartGlobal)) {
            const error = "Chart.js library is not loaded or not available";
            console.error(`[ChartJS] ${error}`);
            await notify("Chart library not available", "error");
            safeCompleteRendering(false);
            return false;
        }

        // Use state-managed data validation (read directly to avoid TDZ if tests import during init)
        // Distinguish between missing data (warn) and present-but-empty records (handled later with info)
        {
            const data = callGetState("globalData");
            if (!isChartDataObject(data)) {
                console.warn("[ChartJS] No FIT file data available for charts");
                await notify(
                    "No FIT file data available for chart rendering",
                    "warning"
                );
                safeCompleteRendering(false);
                return false;
            }
        }

        // Get validated data through state (must be retrieved before use)
        const globalData = callGetState("globalData");

        // Setup zone data from FIT file (use safe accessor so tests can spy)
        const setup = getSetupZoneDataSafe();
        // Let errors bubble to outer catch so critical errors are surfaced as notifications in tests
        setup(globalData);

        await touchChartRenderDependencies({
            getConverters: getConvertersSafe,
            getThemeConfig: getThemeConfigSafe,
        });

        // Validate record messages (main time-series data)
        const recordMesgs = getRecordMessages(globalData);
        if (!recordMesgs) {
            console.warn("[ChartJS] No record messages found in FIT data");
            await notify("No chartable data found in this FIT file", "info");

            await renderNoChartDataPlaceholder(
                { doc: document, getThemeConfig: getThemeConfigSafe },
                targetContainer
            );
            safeCompleteRendering(false);
            return false;
        }

        console.log(
            `[ChartJS] Found ${recordMesgs.length} data points to process`
        );

        // Get the actual start time from the first valid record message (handle malformed entries)
        const activityStartTime = getActivityStartTime(recordMesgs);
        if (activityStartTime != null) {
            console.log("[ChartJS] Activity start time:", activityStartTime);
        }

        // Store chart data in state for other components (use safe state manager)
        const { setState: ss_renderStart } = getStateManagerSafe();
        storeChartData(
            { setState: ss_renderStart },
            recordMesgs,
            activityStartTime
        );

        // Measure total render time including the expensive chart creation path.
        // (Previously this was computed before renderChartsWithData ran, producing misleading ~0ms logs.)
        let renderTime = 0;

        // Ensure renderer modules are referenced in tests to satisfy integration spies, even if the
        // internal renderer short-circuits later. These are no-ops in production and mocked in tests.
        touchRendererModulesForTest(
            {
                createElement: (tagName) => document.createElement(tagName),
                getRendererModules: getRendererModulesSafe,
                isTestEnvironment,
            },
            recordMesgs,
            activityStartTime
        );

        const success = await runChartRender(
            {
                renderChartsWithData,
                warn: (message, error) => console.warn(message, error),
            },
            targetContainer,
            recordMesgs,
            activityStartTime,
            {
                skipControls,
                skipTabAbort: skipTabAbort || allowInactiveTab,
            }
        );
        renderTime = performance.now() - performanceStart;
        console.log(
            `[ChartJS] Chart rendering completed in ${renderTime.toFixed(2)}ms`
        );

        // Complete rendering process through state actions
        const chartCount = chartGlobal._chartjsInstances
            ? chartGlobal._chartjsInstances.length
            : 0;
        completeChartRendering(
            { getGlobalChartActions, safeCompleteRendering },
            success,
            chartCount,
            renderTime
        );
        // Hover effects are applied within renderChartsWithData (deferred). Avoid duplicate passes here.
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
 * Resets the chart state tracking - call when loading a new FIT file This
 * ensures notifications are shown for the first render of a new file
 */
// resetChartNotificationState now imported and re-exported

/**
 * Updates the previous chart state tracking
 *
 * @param {number} chartCount - Current chart count
 * @param {number} visibleFields - Current visible field count
 * @param {number} timestamp - Current timestamp
 */
// updatePreviousChartState now imported and re-exported

/**
 * Renders charts with validated data
 *
 * @private
 */
/**
 * @param {Element | string} targetContainer - Container element or selector
 *   for charts
 * @param {Object[]} recordMesgs - FIT file record messages
 * @param {number | Date | null} startTime - Activity start time used for label
 *   generation
 * @param {{ skipTabAbort?: boolean; skipControls?: boolean }} [options]
 *
 * @returns {Promise<boolean>} Success status
 */
async function renderChartsWithData(
    targetContainer,
    recordMesgs,
    startTime,
    options = {}
) {
    const isTestRuntime = isTestEnvironment();
    const isDebugLoggingEnabled =
        isDevelopmentEnvironment() && isChartDebugEnabled();
    const { skipControls = false, skipTabAbort = false } =
        options && typeof options === "object" ? options : {};

    const renderStartTime = performance.now();

    // Preflight DOM capability check to surface DOM issues early (tested scenario)
    // This will throw in the specific test where document.createElement is mocked to throw,
    // allowing the error to be handled by the outer try/catch in renderChartJS()
    document.createElement("div");

    // Get theme configuration for consistent theming
    const themeConfig = await getThemeConfigSafe();
    // Resolve dynamic/safe dependencies (ensure test spies are hit)
    const convert = getConvertersSafe();
    const {
        createChartCanvas: createChartCanvasSafe,
        createEnhancedChart: createEnhancedChartSafe,
        renderEventMessagesChart: renderEventMessagesChartSafe,
        renderGPSTimeChart: renderGPSTimeChartSafe,
        renderGPSTrackChart: renderGPSTrackChartSafe,
        renderLapZoneCharts: renderLapZoneChartsSafe,
        renderPerformanceAnalysisCharts: renderPerformanceAnalysisChartsSafe,
        renderTimeInZoneCharts: renderTimeInZoneChartsSafe,
    } = getRendererModulesSafe();
    const {
        addChartHoverEffects: addChartHoverEffectsSafe,
        addHoverEffectsToExistingCharts: addHoverEffectsToExistingChartsSafe,
        removeChartHoverEffects: removeChartHoverEffectsSafe,
    } = getHoverPluginsSafe();
    const showRenderNotificationSafe = getShowRenderNotificationSafe();
    const {
        setState: ss_rcwd,
        updateState: us_rcwd,
        getState: gs_rcwd,
    } = getStateManagerSafe();

    const chartContainer = prepareChartRenderContainer(
        {
            doc: document,
            removeChartHoverEffects: removeChartHoverEffectsSafe,
        },
        { skipControls, targetContainer }
    );

    // Get current settings through enhanced state management
    const settings = chartSettingsManager.getSettings(),
        {
            animation: animationStyle = "normal",
            chartType = "line",
            colors: customColors = [],
            exportTheme = "auto",
            interpolation = "linear",
            maxpoints: maxPoints = DEFAULT_MAX_POINTS,
            showFill = false,
            showGrid = true,
            showLegend = true,
            showPoints = false,
            showTitle = true,
            smoothing = 0.1,
            timeUnits = "seconds",
            distanceUnits = "kilometers",
            temperatureUnits = "celsius",
        } = settings,
        // Convert boolean settings from strings (maintain backward compatibility)
        boolSettings = {
            showFill: String(showFill) === "on" || showFill === true,
            showGrid: String(showGrid) !== "off" && showGrid !== false,
            showLegend: String(showLegend) !== "off" && showLegend !== false,
            showPoints: String(showPoints) === "on" || showPoints === true,
            showTitle: String(showTitle) !== "off" && showTitle !== false,
        };
    const normalizedMaxPoints = normalizeMaxPointsValue(maxPoints);
    const dataSettingsSignature = ensureDataSettingsSignature(settings);
    const performanceTuning = resolvePerformanceSettings(
        recordMesgs.length,
        settings,
        dataSettingsSignature
    );
    ss_rcwd(
        "charts.chartOptions",
        {
            ...settings,
            boolSettings,
            performanceTuning,
            processedAt: Date.now(),
        },
        { silent: false, source: "renderChartsWithData" }
    );

    const currentTheme = detectCurrentTheme();
    const zoomPluginConfig = createChartZoomPluginConfig(themeConfig);
    if (isDebugLoggingEnabled) {
        console.log("[renderChartsWithData] Detected theme:", currentTheme);
    }

    // Process data using memoization helpers to avoid redundant conversions across renders
    const data = recordMesgs;
    const labels = getLabelsForRecords(recordMesgs, startTime);

    let visibleFieldCount = 0;
    const fieldsToRender = resolveRenderableChartFields(
        chartState.renderableFields,
        recordMesgs
    );

    if (isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Processing ${fieldsToRender.length} candidate fields (visibility managed via settings state)`
        );
    }

    const { effectiveAnimationStyle, estimatedChartCount } =
        resolveChartAnimationTuning(animationStyle, fieldsToRender.length);
    if (isDebugLoggingEnabled && effectiveAnimationStyle !== animationStyle) {
        console.log(
            `[ChartJS] Auto-tuned animation from ${String(animationStyle)} to ${String(
                effectiveAnimationStyle
            )} (estimatedCharts=${estimatedChartCount})`
        );
    }

    for (const field of fieldsToRender) {
        // Check if still on chart tab before each chart creation (skip in tests)
        if (!isTestRuntime && !skipTabAbort) {
            const currentTab = gs_rcwd("ui.activeTab");
            if (currentTab !== "chart" && currentTab !== "chartjs") {
                console.log(
                    `[ChartJS] Aborting render loop - tab switched to ${currentTab}`
                );
                return false;
            }
        }

        const visibility = chartSettingsManager.getFieldVisibility(field);
        if (visibility === "hidden") {
            if (isDebugLoggingEnabled) {
                console.log(`[ChartJS] Skipping hidden field: ${field}`);
            }
            continue;
        }

        const seriesEntry = getFieldSeriesEntry(
            recordMesgs,
            field,
            dataSettingsSignature,
            convert
        );
        const rawValueCount = seriesEntry.values.length;
        const {
            axisRanges,
            hasValidData,
            points: limitedPoints,
        } = getCachedSeriesForSettings(
            seriesEntry,
            labels,
            normalizedMaxPoints
        );

        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Field ${field}: ${rawValueCount} values (${limitedPoints.length} after limiting); visibility=${visibility}`
            );
        }

        if (!hasValidData) {
            if (isDebugLoggingEnabled) {
                console.log(
                    `[ChartJS] Skipping field ${field} - no valid data after memoization`
                );
            }
            continue;
        }

        visibleFieldCount += 1;
        const canvas = createChartCanvasSafe(field, visibleFieldCount);
        safeAppend(chartContainer, canvas);

        const chart = createEnhancedChartSafe(
            canvas,
            {
                animationStyle: effectiveAnimationStyle,
                axisRanges,
                chartData: limitedPoints,
                chartType,
                customColors,
                decimation: performanceTuning.decimation,
                enableSpanGaps: shouldUseSpanGaps(
                    performanceTuning,
                    seriesEntry
                ),
                field,
                fieldLabels,
                interpolation,
                showFill: boolSettings.showFill,
                showGrid: boolSettings.showGrid,
                showLegend: boolSettings.showLegend,
                showPoints: boolSettings.showPoints,
                showTitle: boolSettings.showTitle,
                smoothing,
                tickSampleSize: performanceTuning.tickSampleSize,
                theme: exportTheme,
                zoomPluginConfig,
                timeUnits,
                distanceUnits,
                temperatureUnits,
            }
        );
        if (chart) {
            chartGlobal._chartjsInstances.push(chart);
            // Register chart with resource manager for automatic cleanup
            resourceManager.registerChart(chart, { owner: "renderChartJS" });
        }
    }

    renderSupplementalCharts(
        {
            chartContainer,
            labels,
            renderers: {
                renderEventMessagesChart: renderEventMessagesChartSafe,
                renderGPSTimeChart: renderGPSTimeChartSafe,
                renderGPSTrackChart: renderGPSTrackChartSafe,
                renderLapZoneCharts: renderLapZoneChartsSafe,
                renderPerformanceAnalysisCharts:
                    renderPerformanceAnalysisChartsSafe,
                renderTimeInZoneCharts: renderTimeInZoneChartsSafe,
            },
            visibility: {
                getFieldVisibility: (field) =>
                    chartSettingsManager.getFieldVisibility(field),
            },
        },
        {
            animationStyle: effectiveAnimationStyle,
            chartType,
            customColors,
            data,
            interpolation,
            maxPoints: normalizedMaxPoints,
            showFill: boolSettings.showFill,
            showGrid: boolSettings.showGrid,
            showLegend: boolSettings.showLegend,
            showPoints: boolSettings.showPoints,
            showTitle: boolSettings.showTitle,
            smoothing,
            startTime,
            zoomPluginConfig,
        }
    );
    const { totalChartsRendered } = resolveChartRenderResultState(
        {
            chartContainer,
            chartInstances: chartGlobal._chartjsInstances,
            renderNoDataMessage,
        },
        { visibleFieldCount }
    );

    // Performance logging with state updates using updateState
    const endTime = performance.now();
    const renderTime = endTime - renderStartTime;
    console.log(
        `[ChartJS] Rendered ${totalChartsRendered} charts (sync) in ${renderTime.toFixed(2)}ms`
    );

    updateChartRenderPerformanceState(
        { getState: gs_rcwd, updateState: us_rcwd },
        { renderTime, totalChartsRendered }
    );

    handleChartRenderNotification(
        {
            getState: gs_rcwd,
            isTestRuntime,
            notify,
            showRenderNotification: showRenderNotificationSafe,
            updateState: us_rcwd,
        },
        {
            totalChartsRendered,
            visibleFieldCount,
        }
    );

    await applyCompletedChartHoverEffects(
        {
            addChartHoverEffects: addChartHoverEffectsSafe,
            addHoverEffectsToExistingCharts: addHoverEffectsToExistingChartsSafe,
            chartContainer,
            getThemeConfig: () =>
                chartGlobal.getThemeConfig
                    ? chartGlobal.getThemeConfig()
                    : getThemeConfigSafe(),
            isTestRuntime,
            updateChartControlsUI:
                (enabled) =>
                    getUIStateManagerMaybe()?.updateChartControlsUI?.(enabled),
        },
        { totalChartsRendered }
    );

    completeChartRenderState(
        {
            CustomEventConstructor: globalThis.CustomEvent,
            doc: document,
            emitChartsRenderedEvent,
            getComputedStateManager: getComputedStateManagerSafe,
            getState,
            now: Date.now,
            updatePreviousChartState,
        },
        {
            renderTime,
            totalChartsRendered,
            visibleFieldCount,
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
    debounce: (callback, delay) => debounce(callback, delay),
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

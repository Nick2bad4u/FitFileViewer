type ChartRuntimeCallable = (...args: unknown[]) => unknown;

interface ChartRendererModules {
    readonly createChartCanvas: ChartRuntimeCallable;
    readonly createEnhancedChart: ChartRuntimeCallable;
    readonly renderEventMessagesChart: ChartRuntimeCallable;
    readonly renderGPSTimeChart: ChartRuntimeCallable;
    readonly renderGPSTrackChart: ChartRuntimeCallable;
    readonly renderLapZoneCharts: ChartRuntimeCallable;
    readonly renderPerformanceAnalysisCharts: ChartRuntimeCallable;
    readonly renderTimeInZoneCharts: ChartRuntimeCallable;
}

interface ChartHoverPlugins {
    readonly addChartHoverEffects: ChartRuntimeCallable;
    readonly addHoverEffectsToExistingCharts: ChartRuntimeCallable;
    readonly removeChartHoverEffects: ChartRuntimeCallable;
}

interface ChartStateManagerAccess {
    readonly getState: ChartRuntimeCallable;
    readonly setState: ChartRuntimeCallable;
    readonly updateState: ChartRuntimeCallable;
}

interface ResolveChartRuntimeDependenciesInput {
    readonly getConverters: () => unknown;
    readonly getHoverPlugins: () => ChartHoverPlugins;
    readonly getRendererModules: () => ChartRendererModules;
    readonly getShowRenderNotification: () => ChartRuntimeCallable;
    readonly getStateManager: () => ChartStateManagerAccess;
    readonly getThemeConfig: () => Promise<unknown> | unknown;
}

/** Late-bound chart render dependencies resolved for a single render pass. */
export interface ResolvedChartRuntimeDependencies {
    readonly addChartHoverEffectsSafe: ChartRuntimeCallable;
    readonly addHoverEffectsToExistingChartsSafe: ChartRuntimeCallable;
    readonly convert: unknown;
    readonly createChartCanvasSafe: ChartRuntimeCallable;
    readonly createEnhancedChartSafe: ChartRuntimeCallable;
    readonly gs_rcwd: ChartRuntimeCallable;
    readonly removeChartHoverEffectsSafe: ChartRuntimeCallable;
    readonly renderEventMessagesChartSafe: ChartRuntimeCallable;
    readonly renderGPSTimeChartSafe: ChartRuntimeCallable;
    readonly renderGPSTrackChartSafe: ChartRuntimeCallable;
    readonly renderLapZoneChartsSafe: ChartRuntimeCallable;
    readonly renderPerformanceAnalysisChartsSafe: ChartRuntimeCallable;
    readonly renderTimeInZoneChartsSafe: ChartRuntimeCallable;
    readonly showRenderNotificationSafe: ChartRuntimeCallable;
    readonly ss_rcwd: ChartRuntimeCallable;
    readonly themeConfig: unknown;
    readonly us_rcwd: ChartRuntimeCallable;
}

/**
 * Resolves late-bound chart renderer dependencies for a render pass.
 *
 * @param input - Accessors for dynamically injected renderer dependencies.
 * @returns Safe dependency aliases consumed by the chart render loop.
 */
export async function resolveChartRuntimeDependencies(
    input: ResolveChartRuntimeDependenciesInput
): Promise<ResolvedChartRuntimeDependencies> {
    const themeConfig = await input.getThemeConfig();
    const convert = input.getConverters();
    const {
        createChartCanvas: createChartCanvasSafe,
        createEnhancedChart: createEnhancedChartSafe,
        renderEventMessagesChart: renderEventMessagesChartSafe,
        renderGPSTimeChart: renderGPSTimeChartSafe,
        renderGPSTrackChart: renderGPSTrackChartSafe,
        renderLapZoneCharts: renderLapZoneChartsSafe,
        renderPerformanceAnalysisCharts: renderPerformanceAnalysisChartsSafe,
        renderTimeInZoneCharts: renderTimeInZoneChartsSafe,
    } = input.getRendererModules();
    const {
        addChartHoverEffects: addChartHoverEffectsSafe,
        addHoverEffectsToExistingCharts: addHoverEffectsToExistingChartsSafe,
        removeChartHoverEffects: removeChartHoverEffectsSafe,
    } = input.getHoverPlugins();
    const showRenderNotificationSafe = input.getShowRenderNotification();
    const {
        getState: gs_rcwd,
        setState: ss_rcwd,
        updateState: us_rcwd,
    } = input.getStateManager();

    return {
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
    };
}

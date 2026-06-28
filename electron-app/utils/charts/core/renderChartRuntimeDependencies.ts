import type {
    getConvertersSafe,
    getHoverPluginsSafe,
    getRendererModulesSafe,
    getShowRenderNotificationSafe,
} from "./renderChartDependencyAccessors.js";
import type { getStateManagerSafe } from "./renderChartStateAccess.js";

type ChartRendererModules = ReturnType<typeof getRendererModulesSafe>;
type ChartHoverPlugins = ReturnType<typeof getHoverPluginsSafe>;
type ChartStateManagerAccess = ReturnType<typeof getStateManagerSafe>;
type ShowRenderNotificationFunction = ReturnType<
    typeof getShowRenderNotificationSafe
>;
type UnitConverter = ReturnType<typeof getConvertersSafe>;

interface ResolveChartRuntimeDependenciesInput {
    readonly getConverters: () => UnitConverter;
    readonly getHoverPlugins: () => ChartHoverPlugins;
    readonly getRendererModules: () => ChartRendererModules;
    readonly getShowRenderNotification: () => ShowRenderNotificationFunction;
    readonly getStateManager: () => ChartStateManagerAccess;
    readonly getThemeConfig: () => unknown;
}

/** Late-bound chart render dependencies resolved for a single render pass. */
export interface ResolvedChartRuntimeDependencies {
    readonly addChartHoverEffectsSafe: ChartHoverPlugins["addChartHoverEffects"];
    readonly addHoverEffectsToExistingChartsSafe: ChartHoverPlugins["addHoverEffectsToExistingCharts"];
    readonly convert: UnitConverter;
    readonly createChartCanvasSafe: ChartRendererModules["createChartCanvas"];
    readonly createEnhancedChartSafe: ChartRendererModules["createEnhancedChart"];
    readonly gs_rcwd: ChartStateManagerAccess["getState"];
    readonly removeChartHoverEffectsSafe: ChartHoverPlugins["removeChartHoverEffects"];
    readonly renderEventMessagesChartSafe: ChartRendererModules["renderEventMessagesChart"];
    readonly renderGPSTimeChartSafe: ChartRendererModules["renderGPSTimeChart"];
    readonly renderGPSTrackChartSafe: ChartRendererModules["renderGPSTrackChart"];
    readonly renderLapZoneChartsSafe: ChartRendererModules["renderLapZoneCharts"];
    readonly renderPerformanceAnalysisChartsSafe: ChartRendererModules["renderPerformanceAnalysisCharts"];
    readonly renderTimeInZoneChartsSafe: ChartRendererModules["renderTimeInZoneCharts"];
    readonly showRenderNotificationSafe: ShowRenderNotificationFunction;
    readonly themeConfig: unknown;
    readonly us_rcwd: ChartStateManagerAccess["updateState"];
}

/**
 * Resolves late-bound chart renderer dependencies for a render pass.
 *
 * @param input - Accessors for dynamically injected renderer dependencies.
 *
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
    const stateManager = input.getStateManager();

    return {
        addChartHoverEffectsSafe,
        addHoverEffectsToExistingChartsSafe,
        convert,
        createChartCanvasSafe,
        createEnhancedChartSafe,
        gs_rcwd: (path) => stateManager.getState(path),
        removeChartHoverEffectsSafe,
        renderEventMessagesChartSafe,
        renderGPSTimeChartSafe,
        renderGPSTrackChartSafe,
        renderLapZoneChartsSafe,
        renderPerformanceAnalysisChartsSafe,
        renderTimeInZoneChartsSafe,
        showRenderNotificationSafe,
        themeConfig,
        us_rcwd: (path, value, options) =>
            stateManager.updateState(path, value, options),
    };
}

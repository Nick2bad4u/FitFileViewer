import {
    renderPrimaryChartFields,
    type RenderPrimaryChartFieldsResult,
} from "./renderChartPrimaryFields.js";
import { renderSupplementalCharts } from "./renderChartSupplementalCharts.js";
import type { ChartDataRecord } from "./renderChartDataPreparation.js";

type PrimaryRenderDependencies = Parameters<typeof renderPrimaryChartFields>[0];
type PrimaryRenderInput = Parameters<typeof renderPrimaryChartFields>[1];
type SupplementalRenderDependencies = Parameters<
    typeof renderSupplementalCharts
>[0];
type SupplementalRenderInput = Parameters<typeof renderSupplementalCharts>[1];

interface RenderChartDataChartsDependencies extends Omit<
    PrimaryRenderDependencies,
    "getFieldVisibility" | "chartContainer"
> {
    readonly chartContainer: HTMLElement;
    readonly getFieldVisibility: (field: string) => unknown;
    readonly renderers: SupplementalRenderDependencies["renderers"];
}

interface RenderChartDataChartsInput {
    readonly animationStyle: SupplementalRenderInput["animationStyle"];
    readonly boolSettings: PrimaryRenderInput["boolSettings"];
    readonly chartType: SupplementalRenderInput["chartType"];
    readonly convert: PrimaryRenderInput["convert"];
    readonly customColors: SupplementalRenderInput["customColors"];
    readonly dataSettingsSignature: PrimaryRenderInput["dataSettingsSignature"];
    readonly distanceUnits: PrimaryRenderInput["distanceUnits"];
    readonly exportTheme: PrimaryRenderInput["exportTheme"];
    readonly fieldsToRender: PrimaryRenderInput["fieldsToRender"];
    readonly interpolation: SupplementalRenderInput["interpolation"];
    readonly labels: SupplementalRenderDependencies["labels"];
    readonly normalizedMaxPoints: PrimaryRenderInput["normalizedMaxPoints"];
    readonly performanceTuning: PrimaryRenderInput["performanceTuning"];
    readonly recordMesgs: readonly ChartDataRecord[];
    readonly smoothing: SupplementalRenderInput["smoothing"];
    readonly startTime: SupplementalRenderInput["startTime"];
    readonly temperatureUnits: PrimaryRenderInput["temperatureUnits"];
    readonly timeUnits: PrimaryRenderInput["timeUnits"];
    readonly zoomPluginConfig: SupplementalRenderInput["zoomPluginConfig"];
}

/**
 * Renders primary metric charts followed by supplemental chart families.
 *
 * @param dependencies - Runtime chart construction, state, visibility, and
 *   renderer hooks.
 * @param input - Data, settings, labels, and theme-aware render options.
 *
 * @returns Render-loop status and number of visible primary field charts.
 */
export function renderChartDataCharts(
    dependencies: RenderChartDataChartsDependencies,
    input: RenderChartDataChartsInput
): RenderPrimaryChartFieldsResult {
    const primaryFieldRenderResult = renderPrimaryChartFields(
        {
            chartContainer: dependencies.chartContainer,
            createChartCanvas: dependencies.createChartCanvas,
            createEnhancedChart: dependencies.createEnhancedChart,
            getActiveTab: dependencies.getActiveTab,
            getFieldVisibility: dependencies.getFieldVisibility,
            isDebugLoggingEnabled: dependencies.isDebugLoggingEnabled,
            isTestRuntime: dependencies.isTestRuntime,
            registerChart: dependencies.registerChart,
            skipTabAbort: dependencies.skipTabAbort,
        },
        input
    );
    if (!primaryFieldRenderResult.aborted) {
        renderSupplementalCharts(
            {
                chartContainer: dependencies.chartContainer,
                labels: input.labels,
                renderers: dependencies.renderers,
                visibility: {
                    getFieldVisibility: dependencies.getFieldVisibility,
                },
            },
            {
                animationStyle: input.animationStyle,
                chartType: input.chartType,
                customColors: input.customColors,
                data: input.recordMesgs,
                interpolation: input.interpolation,
                maxPoints: input.normalizedMaxPoints,
                showFill: input.boolSettings.showFill,
                showGrid: input.boolSettings.showGrid,
                showLegend: input.boolSettings.showLegend,
                showPoints: input.boolSettings.showPoints,
                showTitle: input.boolSettings.showTitle,
                smoothing: input.smoothing,
                startTime: input.startTime,
                zoomPluginConfig: input.zoomPluginConfig,
            }
        );
    }

    return primaryFieldRenderResult;
}

import { fieldLabels } from "../../formatting/display/formatChartFields.js";
import type { createChartCanvas } from "../components/createChartCanvas.js";
import type { createEnhancedChart } from "../components/createEnhancedChart.js";
import type { ChartDataRecord } from "./renderChartDataPreparation.js";
import { safeAppend } from "./renderChartDomHelpers.js";
import {
    shouldUseSpanGaps,
    type ChartPerformanceSettings,
} from "./renderChartPerformanceSettings.js";
import type { MaxPointsValue } from "./renderChartPointUtils.js";
import {
    getCachedSeriesForSettings,
    getFieldSeriesEntry,
    type NumericFieldConverter,
} from "./renderChartSeriesCache.js";

type ChartRenderBooleanSettings = {
    showFill: boolean;
    showGrid: boolean;
    showLegend: boolean;
    showPoints: boolean;
    showTitle: boolean;
};

type CreateChartCanvas = typeof createChartCanvas;
type CreateEnhancedChart = typeof createEnhancedChart;

type RegisterChart = (chart: unknown) => void;

function toStringRecord(
    value: unknown
): Readonly<Record<string, string>> | undefined {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }

    const entries = Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
    );
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function toReadonlyRecord(
    value: unknown
): Readonly<Record<string, unknown>> | undefined {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }

    const entries = Object.entries(value).map(
        ([key, entry]): [string, unknown] => [key, entry]
    );
    return Object.fromEntries(entries);
}

interface RenderPrimaryChartFieldsDependencies {
    chartContainer: ParentNode;
    createChartCanvas: CreateChartCanvas;
    createEnhancedChart: CreateEnhancedChart;
    getActiveTab(): unknown;
    getFieldVisibility(field: string): unknown;
    isDebugLoggingEnabled: boolean;
    isTestRuntime: boolean;
    registerChart: RegisterChart;
    skipTabAbort: boolean;
}

interface RenderPrimaryChartFieldsOptions {
    animationStyle: string;
    boolSettings: ChartRenderBooleanSettings;
    chartType: string;
    convert: NumericFieldConverter;
    customColors: unknown;
    dataSettingsSignature: string;
    distanceUnits: string;
    exportTheme: string;
    fieldsToRender: readonly string[];
    interpolation: string;
    labels: readonly unknown[];
    normalizedMaxPoints: MaxPointsValue;
    performanceTuning: ChartPerformanceSettings;
    recordMesgs: readonly ChartDataRecord[];
    smoothing: number;
    temperatureUnits: string;
    timeUnits: string;
    zoomPluginConfig: Record<string, unknown>;
}

/** Result of rendering the primary data-field charts. */
export interface RenderPrimaryChartFieldsResult {
    aborted: boolean;
    visibleFieldCount: number;
}

/**
 * Renders primary FIT data-field charts into the target container.
 *
 * @param dependencies - DOM, visibility, runtime, and registration hooks.
 * @param options - Normalized settings and data used by the field loop.
 *
 * @returns Render-loop status and number of visible charts created.
 */
export function renderPrimaryChartFields(
    dependencies: RenderPrimaryChartFieldsDependencies,
    options: RenderPrimaryChartFieldsOptions
): RenderPrimaryChartFieldsResult {
    let visibleFieldCount = 0;

    for (const field of options.fieldsToRender) {
        if (!dependencies.isTestRuntime && !dependencies.skipTabAbort) {
            const currentTab = dependencies.getActiveTab();
            if (currentTab !== "chart" && currentTab !== "chartjs") {
                console.log(
                    `[ChartJS] Aborting render loop - tab switched to ${String(currentTab)}`
                );
                return { aborted: true, visibleFieldCount };
            }
        }

        const visibility = dependencies.getFieldVisibility(field);
        if (visibility === "hidden") {
            if (dependencies.isDebugLoggingEnabled) {
                console.log(`[ChartJS] Skipping hidden field: ${field}`);
            }
            continue;
        }

        const seriesEntry = getFieldSeriesEntry(
            options.recordMesgs,
            field,
            options.dataSettingsSignature,
            options.convert
        );
        const rawValueCount = seriesEntry.values.length;
        const {
            axisRanges,
            hasValidData,
            points: limitedPoints,
        } = getCachedSeriesForSettings(
            seriesEntry,
            options.labels,
            options.normalizedMaxPoints
        );

        if (dependencies.isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Field ${field}: ${rawValueCount} values (${limitedPoints.length} after limiting); visibility=${String(visibility)}`
            );
        }

        if (!hasValidData) {
            if (dependencies.isDebugLoggingEnabled) {
                console.log(
                    `[ChartJS] Skipping field ${field} - no valid data after memoization`
                );
            }
            continue;
        }

        visibleFieldCount += 1;
        const canvas = dependencies.createChartCanvas(field, visibleFieldCount);
        safeAppend(dependencies.chartContainer, canvas);

        const customColors = toStringRecord(options.customColors);
        const decimation = toReadonlyRecord(
            options.performanceTuning.decimation
        );
        const { tickSampleSize } = options.performanceTuning;
        const createChartOptions = {
            animationStyle: options.animationStyle,
            chartData: limitedPoints,
            chartType: options.chartType,
            distanceUnits: options.distanceUnits,
            enableSpanGaps: shouldUseSpanGaps(
                options.performanceTuning,
                seriesEntry
            ),
            field,
            fieldLabels,
            interpolation: options.interpolation,
            showFill: options.boolSettings.showFill,
            showGrid: options.boolSettings.showGrid,
            showLegend: options.boolSettings.showLegend,
            showPoints: options.boolSettings.showPoints,
            showTitle: options.boolSettings.showTitle,
            smoothing: options.smoothing,
            temperatureUnits: options.temperatureUnits,
            theme: options.exportTheme,
            timeUnits: options.timeUnits,
            zoomPluginConfig: options.zoomPluginConfig,
            ...(axisRanges === null || axisRanges === undefined
                ? {}
                : { axisRanges }),
            ...(customColors === undefined ? {} : { customColors }),
            ...(decimation === undefined ? {} : { decimation }),
            ...(tickSampleSize === undefined ? {} : { tickSampleSize }),
        };

        const chart = dependencies.createEnhancedChart(canvas, {
            ...createChartOptions,
        });

        if (chart) {
            dependencies.registerChart(chart);
        }
    }

    return { aborted: false, visibleFieldCount };
}

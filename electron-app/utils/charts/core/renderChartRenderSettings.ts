import { type ChartPerformanceSettings } from "./renderChartPerformanceSettings.js";
import type { ChartStateUpdateOptions } from "./renderChartStateAccess.js";
import {
    type MaxPointsValue,
    normalizeMaxPointsValue,
} from "./renderChartPointUtils.js";

type ChartRenderSettingsRecord = Record<string, unknown>;

type ResolvePerformanceSettings = (
    totalPoints: number,
    settings: ChartRenderSettingsRecord,
    dataSettingsSignature: string
) => ChartPerformanceSettings;

type SetChartOptionsState = (
    path: string,
    value: unknown,
    options?: ChartStateUpdateOptions
) => unknown;

interface ResolveChartRenderSettingsDependencies {
    defaultMaxPoints: number;
    ensureDataSettingsSignature(settings: ChartRenderSettingsRecord): string;
    getSettings(): ChartRenderSettingsRecord;
    resolvePerformanceSettings: ResolvePerformanceSettings;
    setChartOptionsState: SetChartOptionsState;
}

interface ResolveChartRenderSettingsParams {
    processedAt: number;
    recordCount: number;
}

/** Boolean chart display settings normalized from persisted string values. */
export interface ChartRenderBooleanSettings {
    showFill: boolean;
    showGrid: boolean;
    showLegend: boolean;
    showPoints: boolean;
    showTitle: boolean;
}

/** Normalized render settings consumed by renderChartsWithData. */
export interface ResolvedChartRenderSettings {
    animationStyle: string;
    boolSettings: ChartRenderBooleanSettings;
    chartType: string;
    customColors: unknown;
    dataSettingsSignature: string;
    distanceUnits: string;
    exportTheme: string;
    interpolation: string;
    normalizedMaxPoints: MaxPointsValue;
    performanceTuning: ChartPerformanceSettings;
    settings: ChartRenderSettingsRecord;
    smoothing: number;
    temperatureUnits: string;
    timeUnits: string;
}

function isSettingOn(value: unknown): boolean {
    return String(value) === "on" || value === true;
}

function isSettingNotOff(value: unknown): boolean {
    return String(value) !== "off" && value !== false;
}

function toFiniteNumber(value: unknown, fallback: number): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

/**
 * Resolves persisted chart settings into render-loop inputs and updates state.
 *
 * @param dependencies - Runtime settings, cache signature, performance, and
 *   state hooks.
 * @param params - Data-size inputs for performance tuning.
 *
 * @returns Normalized settings for chart rendering.
 */
export function resolveChartRenderSettings(
    dependencies: ResolveChartRenderSettingsDependencies,
    params: ResolveChartRenderSettingsParams
): ResolvedChartRenderSettings {
    const settings = dependencies.getSettings();
    const {
        animation: animationStyle = "normal",
        chartType = "line",
        colors: customColors = [],
        distanceUnits = "kilometers",
        exportTheme = "auto",
        interpolation = "linear",
        maxpoints: maxPoints = dependencies.defaultMaxPoints,
        showFill = false,
        showGrid = true,
        showLegend = true,
        showPoints = false,
        showTitle = true,
        smoothing = 0.1,
        temperatureUnits = "celsius",
        timeUnits = "seconds",
    } = settings;

    const boolSettings = {
        showFill: isSettingOn(showFill),
        showGrid: isSettingNotOff(showGrid),
        showLegend: isSettingNotOff(showLegend),
        showPoints: isSettingOn(showPoints),
        showTitle: isSettingNotOff(showTitle),
    };
    const normalizedMaxPoints = normalizeMaxPointsValue(maxPoints);
    const dataSettingsSignature =
        dependencies.ensureDataSettingsSignature(settings);
    const performanceTuning = dependencies.resolvePerformanceSettings(
        params.recordCount,
        settings,
        dataSettingsSignature
    );

    dependencies.setChartOptionsState(
        "charts.chartOptions",
        {
            ...settings,
            boolSettings,
            performanceTuning,
            processedAt: params.processedAt,
        },
        { silent: false, source: "renderChartsWithData" }
    );

    return {
        animationStyle: String(animationStyle),
        boolSettings,
        chartType: String(chartType),
        customColors,
        dataSettingsSignature,
        distanceUnits: String(distanceUnits),
        exportTheme: String(exportTheme),
        interpolation: String(interpolation),
        normalizedMaxPoints,
        performanceTuning,
        settings,
        smoothing: toFiniteNumber(smoothing, 0.1),
        temperatureUnits: String(temperatureUnits),
        timeUnits: String(timeUnits),
    };
}

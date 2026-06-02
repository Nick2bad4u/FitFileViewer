import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertTimeUnits } from "../../formatting/converters/convertTimeUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { hexToRgba } from "../core/renderChartJS.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { getFieldColor } from "../theming/getFieldColor.js";

type AnimationStyle = string;
type ChartKind = string;
type DistanceUnits = string;
type InterpolationMode = string;
type TemperatureUnits = string;
type TimeUnits = string;

interface AxisRange {
    readonly max: number;
    readonly min: number;
}

interface AxisRanges {
    readonly x?: AxisRange;
    readonly y?: AxisRange;
}

interface ChartPoint {
    readonly x: number;
    readonly y: number | null;
}

export interface CreateEnhancedChartOptions {
    readonly animationStyle?: AnimationStyle;
    readonly axisRanges?: AxisRanges;
    readonly chartData: readonly ChartPoint[];
    readonly chartType: ChartKind;
    readonly customColors?: Readonly<Record<string, string>>;
    readonly decimation?: Readonly<Record<string, unknown>>;
    readonly distanceUnits?: DistanceUnits;
    readonly enableSpanGaps?: boolean;
    readonly field: string;
    readonly fieldLabels?: Readonly<Record<string, string>>;
    readonly interpolation?: InterpolationMode;
    readonly showFill?: boolean;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showPoints?: boolean;
    readonly showTitle?: boolean;
    readonly smoothing?: number;
    readonly temperatureUnits?: TemperatureUnits;
    readonly theme?: string;
    readonly tickSampleSize?: number;
    readonly timeUnits?: TimeUnits;
    readonly zoomPluginConfig?: Readonly<Record<string, unknown>>;
}

interface ResolvedEnhancedChartOptions extends CreateEnhancedChartOptions {
    readonly animationStyle: AnimationStyle;
    readonly chartType: ChartKind;
    readonly currentTheme: string;
    readonly customColors: Readonly<Record<string, string>>;
    readonly decimation: Readonly<Record<string, unknown>>;
    readonly distanceUnits: DistanceUnits;
    readonly enableSpanGaps: boolean;
    readonly fieldLabels: Readonly<Record<string, string>>;
    readonly interpolation: InterpolationMode;
    readonly showFill: boolean;
    readonly showGrid: boolean;
    readonly showLegend: boolean;
    readonly showPoints: boolean;
    readonly showTitle: boolean;
    readonly smoothing: number;
    readonly temperatureUnits: TemperatureUnits;
    readonly timeUnits: TimeUnits;
    readonly zoomPluginConfig: Readonly<Record<string, unknown>>;
}

interface TooltipLabelContext {
    readonly dataset: {
        readonly label?: string;
    };
    readonly parsed: {
        readonly y: number;
    };
}

interface TooltipTitleContext {
    readonly label?: string;
}

interface ChartDatasetConfig {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    cubicInterpolationMode: "default" | "monotone";
    data: readonly ChartPoint[];
    fill: boolean;
    label: string;
    parsing: false;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverRadius: number;
    pointRadius: number;
    showLine?: false;
    spanGaps: boolean;
    stepped: boolean;
    tension: number;
}

export interface EnhancedChartConfig {
    readonly data: {
        readonly datasets: ChartDatasetConfig[];
    };
    readonly options: Record<string, unknown>;
    readonly plugins: readonly unknown[];
    readonly type: string;
}

type ThemeColors = {
    readonly background: string;
    readonly grid: string;
    readonly text: string;
    readonly tooltipBackground: string;
    readonly tooltipBorder: string;
};

function getLocalUnitSymbol(
    field: string,
    type: "time" | undefined,
    timeUnits: TimeUnits,
    distanceUnits: DistanceUnits,
    temperatureUnits: TemperatureUnits
): string {
    if (type === "time") {
        switch (timeUnits) {
            case "hours": {
                return "h";
            }
            case "minutes": {
                return "min";
            }
            default: {
                return "s";
            }
        }
    }

    if (
        field === "distance" ||
        field === "altitude" ||
        field === "enhancedAltitude"
    ) {
        switch (distanceUnits) {
            case "feet": {
                return "ft";
            }
            case "meters": {
                return "m";
            }
            case "miles": {
                return "mi";
            }
            default: {
                return "km";
            }
        }
    }

    if (field === "temperature") {
        return temperatureUnits === "fahrenheit" ? "°F" : "°C";
    }

    if (field === "speed" || field === "enhancedSpeed") {
        return distanceUnits === "miles" || distanceUnits === "feet"
            ? "mph"
            : "km/h";
    }

    return getUnitSymbol(field);
}

function getAnimationDuration(animationStyle: AnimationStyle): number {
    switch (animationStyle) {
        case "fast": {
            return 500;
        }
        case "none": {
            return 0;
        }
        case "slow": {
            return 2000;
        }
        default: {
            return 1000;
        }
    }
}

function getAnimationEasing(animationStyle: AnimationStyle): string {
    switch (animationStyle) {
        case "fast": {
            return "easeInOut";
        }
        case "none":
        case "normal": {
            return "linear";
        }
        default: {
            return animationStyle ? "easeOutQuart" : "linear";
        }
    }
}

function getInterpolationConfig(interpolation: InterpolationMode): {
    cubicInterpolationMode: "default" | "monotone";
    stepped: boolean;
    tension: number;
} {
    if (interpolation === "step") {
        return {
            cubicInterpolationMode: "default",
            stepped: true,
            tension: 0,
        };
    }

    if (interpolation === "monotone") {
        return {
            cubicInterpolationMode: "monotone",
            stepped: false,
            tension: 0,
        };
    }

    return {
        cubicInterpolationMode: "default",
        stepped: false,
        tension: 0,
    };
}

function normalizeChartType(chartType: ChartKind): string {
    return chartType === "area" ? "line" : chartType;
}

function buildAxisRange(
    range: AxisRange | undefined,
    floorAtZero: boolean
): Record<string, number> {
    if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
        return {};
    }

    if (range.min === range.max) {
        return {
            max: range.max + 1,
            min: floorAtZero ? Math.max(range.min - 1, 0) : range.min - 1,
        };
    }

    return {
        max: range.max,
        min: range.min,
    };
}

function convertDisplayValueToRaw(
    value: number,
    field: string,
    distanceUnits: DistanceUnits,
    temperatureUnits: TemperatureUnits
): number {
    switch (field) {
        case "altitude":
        case "distance":
        case "enhancedAltitude": {
            switch (distanceUnits) {
                case "feet": {
                    return value / 3.280_84;
                }
                case "kilometers": {
                    return value * 1000;
                }
                case "miles": {
                    return value * 1609.344;
                }
                default: {
                    return value;
                }
            }
        }
        case "enhancedSpeed":
        case "speed": {
            return distanceUnits === "miles" || distanceUnits === "feet"
                ? value / 2.236_936
                : value / 3.6;
        }
        case "temperature": {
            return temperatureUnits === "fahrenheit"
                ? ((value - 32) * 5) / 9
                : value;
        }
        default: {
            return value;
        }
    }
}

function getNumericTickValue(value: number | string): number {
    return typeof value === "number" ? value : Number(value);
}

function getThemeColors(currentTheme: string): ThemeColors {
    const isDarkTheme = currentTheme === "dark";
    return {
        background: isDarkTheme ? "#181c24" : "#ffffff",
        grid: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        text: isDarkTheme ? "#fff" : "#000",
        tooltipBackground: isDarkTheme ? "#222" : "#fff",
        tooltipBorder: isDarkTheme ? "#555" : "#ddd",
    };
}

function resolveEnhancedChartOptions(
    options: CreateEnhancedChartOptions,
    currentTheme: string
): ResolvedEnhancedChartOptions {
    return {
        animationStyle: "normal",
        customColors: {},
        decimation: { enabled: false },
        distanceUnits: "kilometers",
        enableSpanGaps: false,
        fieldLabels: {},
        interpolation: "linear",
        showFill: false,
        showGrid: false,
        showLegend: false,
        showPoints: false,
        showTitle: false,
        smoothing: 0,
        temperatureUnits: "celsius",
        timeUnits: "seconds",
        zoomPluginConfig: {},
        ...options,
        currentTheme,
    };
}

function createDataset(options: ResolvedEnhancedChartOptions): ChartDatasetConfig {
    const interpolationConfig = getInterpolationConfig(options.interpolation);
    const fieldColor =
        options.customColors[options.field] ?? getFieldColor(options.field);
    const fieldLabel = options.fieldLabels[options.field] ?? options.field;
    const dataset: ChartDatasetConfig = {
        backgroundColor: options.showFill
            ? hexToRgba(fieldColor, 0.2)
            : "transparent",
        borderColor: fieldColor,
        borderWidth: 2,
        cubicInterpolationMode: interpolationConfig.cubicInterpolationMode,
        data: options.chartData,
        fill: options.showFill,
        label: fieldLabel,
        parsing: false,
        pointBackgroundColor: fieldColor,
        pointBorderColor: fieldColor,
        pointHoverRadius: 5,
        pointRadius: options.showPoints ? 3 : 0,
        spanGaps: options.enableSpanGaps,
        stepped: interpolationConfig.stepped,
        tension:
            options.interpolation === "linear"
                ? options.smoothing / 100
                : interpolationConfig.tension,
    };

    if (options.chartType === "bar") {
        dataset.backgroundColor = fieldColor;
        dataset.borderWidth = 1;
    } else if (options.chartType === "scatter") {
        dataset.showLine = false;
        dataset.pointRadius = 4;
    }

    return dataset;
}

function createTooltipOptions(
    options: ResolvedEnhancedChartOptions,
    colors: ThemeColors
): Record<string, unknown> {
    return {
        backgroundColor: colors.tooltipBackground,
        bodyColor: colors.text,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        callbacks: {
            label(context: TooltipLabelContext): string {
                const rawValue = convertDisplayValueToRaw(
                    context.parsed.y,
                    options.field,
                    options.distanceUnits,
                    options.temperatureUnits
                );

                return `${context.dataset.label ?? options.field}: ${formatTooltipWithUnits(rawValue, options.field)}`;
            },
            title(context: readonly TooltipTitleContext[]): string {
                return context[0]?.label ?? "";
            },
        },
        cornerRadius: 6,
        displayColors: true,
        titleColor: colors.text,
    };
}

function createXAxisOptions(
    options: ResolvedEnhancedChartOptions,
    colors: ThemeColors
): Record<string, unknown> {
    return {
        ...buildAxisRange(options.axisRanges?.x, true),
        display: true,
        grid: {
            color: colors.grid,
            display: options.showGrid,
        },
        ticks: {
            callback(value: number | string): string {
                const numericValue = getNumericTickValue(value);
                const convertedValue = convertTimeUnits(
                    numericValue,
                    options.timeUnits
                );

                if (options.timeUnits === "hours") {
                    return `${convertedValue.toFixed(2)}h`;
                }

                if (options.timeUnits === "minutes") {
                    return `${convertedValue.toFixed(1)}m`;
                }

                return formatTime(numericValue);
            },
            color: colors.text,
            ...(options.tickSampleSize
                ? { sampleSize: options.tickSampleSize }
                : {}),
        },
        title: {
            color: colors.text,
            display: true,
            font: {
                size: 12,
                weight: "bold",
            },
            text: `Time (${getLocalUnitSymbol("time", "time", options.timeUnits, options.distanceUnits, options.temperatureUnits)})`,
        },
        type: "linear",
    };
}

function createYAxisOptions(
    options: ResolvedEnhancedChartOptions,
    colors: ThemeColors,
    fieldLabel: string
): Record<string, unknown> {
    return {
        ...buildAxisRange(options.axisRanges?.y, false),
        display: true,
        grid: {
            color: colors.grid,
            display: options.showGrid,
        },
        ticks: {
            color: colors.text,
        },
        title: {
            color: colors.text,
            display: true,
            font: {
                size: 12,
                weight: "bold",
            },
            text: `${fieldLabel} (${getLocalUnitSymbol(options.field, undefined, options.timeUnits, options.distanceUnits, options.temperatureUnits)})`,
        },
    };
}

export function buildEnhancedChartConfig(
    options: CreateEnhancedChartOptions,
    currentTheme: string
): EnhancedChartConfig {
    const resolvedOptions = resolveEnhancedChartOptions(options, currentTheme);
    const colors = getThemeColors(currentTheme);
    const dataset = createDataset(resolvedOptions);
    const fieldLabel = resolvedOptions.fieldLabels[resolvedOptions.field] ??
        resolvedOptions.field;

    return {
        data: {
            datasets: [dataset],
        },
        options: {
            animation: {
                duration: getAnimationDuration(resolvedOptions.animationStyle),
                easing: getAnimationEasing(resolvedOptions.animationStyle),
            },
            interaction: {
                intersect: false,
                mode: "index",
            },
            maintainAspectRatio: false,
            modifierKey: "ctrl",
            normalized: true,
            parsing: false,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: colors.background,
                },
                decimation: resolvedOptions.decimation,
                legend: {
                    display: resolvedOptions.showLegend,
                    labels: {
                        boxHeight: 12,
                        boxWidth: 16,
                        color: colors.text,
                        font: {
                            size: 12,
                        },
                        padding: 12,
                        pointStyleWidth: 16,
                        usePointStyle: true,
                    },
                    position: "top",
                },
                title: {
                    color: colors.text,
                    display: resolvedOptions.showTitle,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    padding: 20,
                    text: `${fieldLabel} (${getLocalUnitSymbol(resolvedOptions.field, undefined, resolvedOptions.timeUnits, resolvedOptions.distanceUnits, resolvedOptions.temperatureUnits)})`,
                },
                tooltip: createTooltipOptions(resolvedOptions, colors),
                zoom: resolvedOptions.zoomPluginConfig,
            },
            responsive: true,
            scales: {
                x: createXAxisOptions(resolvedOptions, colors),
                y: createYAxisOptions(resolvedOptions, colors, fieldLabel),
            },
            spanGaps: resolvedOptions.enableSpanGaps,
        },
        plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        type: normalizeChartType(resolvedOptions.chartType),
    };
}

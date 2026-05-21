import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertTimeUnits } from "../../formatting/converters/convertTimeUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { hexToRgba } from "../core/renderChartJS.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { getFieldColor } from "../theming/getFieldColor.js";

type AnimationStyle = "fast" | "none" | "normal" | "slow" | string;
type ChartKind = "area" | "bar" | "line" | "scatter" | string;
type DistanceUnits = "feet" | "kilometers" | "meters" | "miles" | string;
type InterpolationMode = "linear" | "monotone" | "step" | string;
type TemperatureUnits = "celsius" | "fahrenheit" | string;
type TimeUnits = "hours" | "minutes" | "seconds" | string;

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

interface CreateEnhancedChartOptions {
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

interface EnhancedChartConfig {
    readonly data: {
        readonly datasets: ChartDatasetConfig[];
    };
    readonly options: Record<string, unknown>;
    readonly plugins: readonly unknown[];
    readonly type: string;
}

type EnhancedChartInstance = object;

type ChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: EnhancedChartConfig
) => EnhancedChartInstance;

interface ChartDebugGlobal {
    readonly Chart?: ChartConstructor;
    readonly __FFV_debugCharts?: unknown;
}

const chartGlobal = globalThis as typeof globalThis & ChartDebugGlobal;

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
            case "miles": {
                return "mi";
            }
            case "feet": {
                return "ft";
            }
            case "meters": {
                return "m";
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
        case "none": {
            return 0;
        }
        case "fast": {
            return 500;
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

/**
 * Creates a Chart.js chart with FitFileViewer display settings.
 */
export function createEnhancedChart(
    canvas: HTMLCanvasElement,
    options: CreateEnhancedChartOptions
): EnhancedChartInstance | null {
    const {
        animationStyle = "normal",
        axisRanges,
        chartData,
        chartType,
        customColors = {},
        decimation = { enabled: false },
        distanceUnits = "kilometers",
        enableSpanGaps = false,
        field,
        fieldLabels = {},
        interpolation = "linear",
        showFill = false,
        showGrid = false,
        showLegend = false,
        showPoints = false,
        showTitle = false,
        smoothing = 0,
        temperatureUnits = "celsius",
        theme,
        tickSampleSize,
        timeUnits = "seconds",
        zoomPluginConfig = {},
    } = options;

    try {
        const currentTheme =
            theme && theme !== "auto" ? theme : detectCurrentTheme();
        const isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "development";
        const isDebugLoggingEnabled =
            isDevEnvironment && Boolean(chartGlobal.__FFV_debugCharts);

        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] Theme debugging for field:", field);
            console.log("[ChartJS] - theme param:", theme);
            console.log("[ChartJS] - resolved theme:", currentTheme);
        }

        const interpolationConfig = getInterpolationConfig(interpolation);
        const fieldColor = customColors[field] ?? getFieldColor(field);
        const fieldLabel = fieldLabels[field] ?? field;

        const dataset: ChartDatasetConfig = {
            backgroundColor: showFill
                ? hexToRgba(fieldColor, 0.2)
                : "transparent",
            borderColor: fieldColor,
            borderWidth: 2,
            cubicInterpolationMode: interpolationConfig.cubicInterpolationMode,
            data: chartData,
            fill: showFill,
            label: fieldLabel,
            parsing: false,
            pointBackgroundColor: fieldColor,
            pointBorderColor: fieldColor,
            pointHoverRadius: 5,
            pointRadius: showPoints ? 3 : 0,
            spanGaps: enableSpanGaps,
            stepped: interpolationConfig.stepped,
            tension:
                interpolation === "linear"
                    ? smoothing / 100
                    : interpolationConfig.tension,
        };

        if (chartType === "bar") {
            dataset.backgroundColor = fieldColor;
            dataset.borderWidth = 1;
        } else if (chartType === "scatter") {
            dataset.showLine = false;
            dataset.pointRadius = 4;
        }

        const isDarkTheme = currentTheme === "dark";
        const textColor = isDarkTheme ? "#fff" : "#000";
        const gridColor = isDarkTheme
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)";

        const config: EnhancedChartConfig = {
            data: {
                datasets: [dataset],
            },
            options: {
                animation: {
                    duration: getAnimationDuration(animationStyle),
                    easing: getAnimationEasing(animationStyle),
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
                        backgroundColor: isDarkTheme ? "#181c24" : "#ffffff",
                    },
                    decimation,
                    legend: {
                        display: showLegend,
                        labels: {
                            boxHeight: 12,
                            boxWidth: 16,
                            color: textColor,
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
                        color: textColor,
                        display: showTitle,
                        font: {
                            size: 16,
                            weight: "bold",
                        },
                        padding: 20,
                        text: `${fieldLabel} (${getLocalUnitSymbol(field, undefined, timeUnits, distanceUnits, temperatureUnits)})`,
                    },
                    tooltip: {
                        backgroundColor: isDarkTheme ? "#222" : "#fff",
                        bodyColor: textColor,
                        borderColor: isDarkTheme ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            label(context: TooltipLabelContext): string {
                                const rawValue = convertDisplayValueToRaw(
                                    context.parsed.y,
                                    field,
                                    distanceUnits,
                                    temperatureUnits
                                );

                                return `${context.dataset.label ?? field}: ${formatTooltipWithUnits(rawValue, field)}`;
                            },
                            title(
                                context: readonly TooltipTitleContext[]
                            ): string {
                                return context[0]?.label ?? "";
                            },
                        },
                        cornerRadius: 6,
                        displayColors: true,
                        titleColor: textColor,
                    },
                    zoom: zoomPluginConfig,
                },
                responsive: true,
                scales: {
                    x: {
                        ...buildAxisRange(axisRanges?.x, true),
                        display: true,
                        grid: {
                            color: gridColor,
                            display: showGrid,
                        },
                        ticks: {
                            callback(value: number | string): string {
                                const numericValue = getNumericTickValue(value);
                                const convertedValue = convertTimeUnits(
                                    numericValue,
                                    timeUnits
                                );

                                if (timeUnits === "hours") {
                                    return `${convertedValue.toFixed(2)}h`;
                                }

                                if (timeUnits === "minutes") {
                                    return `${convertedValue.toFixed(1)}m`;
                                }

                                return formatTime(numericValue);
                            },
                            color: textColor,
                            ...(tickSampleSize
                                ? { sampleSize: tickSampleSize }
                                : {}),
                        },
                        title: {
                            color: textColor,
                            display: true,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            text: `Time (${getLocalUnitSymbol("time", "time", timeUnits, distanceUnits, temperatureUnits)})`,
                        },
                        type: "linear",
                    },
                    y: {
                        ...buildAxisRange(axisRanges?.y, false),
                        display: true,
                        grid: {
                            color: gridColor,
                            display: showGrid,
                        },
                        ticks: {
                            color: textColor,
                        },
                        title: {
                            color: textColor,
                            display: true,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            text: `${fieldLabel} (${getLocalUnitSymbol(field, undefined, timeUnits, distanceUnits, temperatureUnits)})`,
                        },
                    },
                },
                spanGaps: enableSpanGaps,
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: normalizeChartType(chartType),
        };

        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

        const ChartConstructor = chartGlobal.Chart;
        if (!ChartConstructor) {
            console.error(
                `[ChartJS] Error creating chart for ${field}:`,
                "Chart.js constructor is unavailable"
            );
            showNotification(
                `Error creating chart for ${field}`,
                "error",
                5000
            );
            return null;
        }

        const chart = new ChartConstructor(canvas, config);

        if (animationStyle !== "none") {
            updateChartAnimations(chart, field);
        }

        return chart;
    } catch (error) {
        console.error(`[ChartJS] Error creating chart for ${field}:`, error);
        showNotification(`Error creating chart for ${field}`, "error", 5000);
        return null;
    }
}

import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import {
    createManagedChart,
    type ManagedChartConfig,
} from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import {
    detectCurrentTheme,
    type ChartTheme,
} from "../theming/chartThemeUtils.js";

interface SpeedDistanceDatum {
    readonly distance?: unknown;
    readonly enhancedSpeed?: unknown;
    readonly speed?: unknown;
}

interface SpeedDistanceOptions {
    readonly animationStyle?: string;
    readonly distanceUnits?: string;
    readonly interpolation?: string;
    readonly maxPoints: "all" | number;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showPoints?: boolean;
    readonly showTitle?: boolean;
    readonly smoothing?: number;
    readonly theme?: string;
}

interface SpeedDistancePoint {
    readonly x: number;
    readonly y: number;
}

interface SpeedDistanceThemeColors {
    readonly background: string;
    readonly chartBackground: string;
    readonly chartBorder: string;
    readonly chartSurface: string;
    readonly grid: string;
    readonly primaryWarning: string;
    readonly shadow: string;
    readonly text: string;
}

interface SpeedDistanceTooltipContext {
    readonly parsed: {
        readonly x?: unknown;
        readonly y?: unknown;
    };
}

const DEFAULT_DARK_BACKGROUND = "#181c24",
    DEFAULT_DARK_BORDER = "#555",
    DEFAULT_DARK_GRID = "rgba(255,255,255,0.1)",
    DEFAULT_DARK_SURFACE = "#222",
    DEFAULT_DARK_TEXT = "#fff",
    DEFAULT_LIGHT_BACKGROUND = "#ffffff",
    DEFAULT_LIGHT_BORDER = "#ddd",
    DEFAULT_LIGHT_GRID = "rgba(0,0,0,0.1)",
    DEFAULT_LIGHT_SURFACE = "#fff",
    DEFAULT_LIGHT_TEXT = "#000",
    DEFAULT_SHADOW = "#00000020",
    DEFAULT_WARNING = "#f59e0b",
    FEET_PER_METER = 3.280_84,
    KILOMETERS_PER_METER = 1 / 1000,
    METERS_PER_MILE = 1609.344,
    MPH_PER_MPS = 2.236_936,
    SPEED_ROUNDING_FACTOR = 100;

/**
 * Render a scatter chart showing speed as a function of distance.
 */
export function renderSpeedVsDistanceChart(
    container: HTMLElement,
    data: readonly SpeedDistanceDatum[],
    options: SpeedDistanceOptions
): void {
    try {
        const {
            animationStyle = "normal",
            distanceUnits = "kilometers",
            interpolation = "linear",
            maxPoints,
            showGrid,
            showLegend,
            showPoints,
            showTitle,
            smoothing = 0.1,
            theme = "auto",
        } = options;

        if (!hasSpeedAndDistance(data)) {
            return;
        }

        if (
            chartSettingsManager.getFieldVisibility("speed_vs_distance") ===
            "hidden"
        ) {
            return;
        }

        const currentTheme = resolveChartTheme(theme),
            colors = getSpeedDistanceThemeColors(currentTheme);

        let chartData = createSpeedDistancePoints(data);

        if (chartData.length === 0) {
            return;
        }

        chartData = limitSpeedDistancePoints(chartData, maxPoints);

        const canvas = createChartCanvas("speed-vs-distance", 0);
        canvas.style.background = colors.background;
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = `0 2px 16px 0 ${colors.shadow}`;
        container.append(canvas);

        const chart = createManagedChart(
            canvas,
            createSpeedDistanceChartConfig({
                animationStyle,
                chartData,
                colors,
                distanceUnits,
                interpolation,
                showGrid,
                showLegend,
                showPoints,
                showTitle,
                smoothing,
            })
        );

        if (chart) {
            console.log(
                "[ChartJS] Speed vs Distance chart created successfully"
            );
        }
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering speed vs distance chart:",
            error
        );
    }
}

function createSpeedDistanceChartConfig({
    animationStyle,
    chartData,
    colors,
    distanceUnits,
    interpolation,
    showGrid,
    showLegend,
    showPoints,
    showTitle,
    smoothing,
}: {
    readonly animationStyle: string;
    readonly chartData: readonly SpeedDistancePoint[];
    readonly colors: SpeedDistanceThemeColors;
    readonly distanceUnits: string;
    readonly interpolation: string;
    readonly showGrid: boolean | undefined;
    readonly showLegend: boolean | undefined;
    readonly showPoints: boolean | undefined;
    readonly showTitle: boolean | undefined;
    readonly smoothing: number;
}): ManagedChartConfig {
    const interpolationConfig = getSpeedDistanceInterpolationConfig(
        interpolation,
        smoothing
    );

    return {
        data: {
            datasets: [
                {
                    backgroundColor: `${colors.primaryWarning}99`,
                    borderColor: colors.primaryWarning,
                    borderWidth: 2,
                    cubicInterpolationMode:
                        interpolationConfig.cubicInterpolationMode,
                    data: chartData,
                    fill: false,
                    label: "Speed vs Distance",
                    pointHoverRadius: 4,
                    pointRadius: showPoints === true ? 2 : 1,
                    showLine: true,
                    stepped: interpolationConfig.stepped,
                    tension: interpolationConfig.tension,
                },
            ],
        },
        options: {
            animation: {
                duration: getAnimationDuration(animationStyle),
                easing: "easeOutQuart",
            },
            maintainAspectRatio: false,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: colors.chartBackground,
                },
                legend: {
                    display: showLegend,
                    labels: { color: colors.text },
                },
                title: {
                    color: colors.text,
                    display: showTitle,
                    font: { size: 16, weight: "bold" },
                    text: "Speed vs Distance",
                },
                tooltip: {
                    backgroundColor: colors.chartSurface,
                    bodyColor: colors.text,
                    borderColor: colors.chartBorder,
                    borderWidth: 1,
                    callbacks: {
                        label(context: SpeedDistanceTooltipContext): string[] {
                            return formatSpeedDistanceTooltip(
                                context,
                                distanceUnits
                            );
                        },
                    },
                    titleColor: colors.text,
                },
                zoom: {
                    limits: {
                        x: {
                            max: "original",
                            min: "original",
                        },
                        y: {
                            max: "original",
                            min: "original",
                        },
                    },
                    pan: {
                        enabled: true,
                        mode: "x",
                        modifierKey: null,
                    },
                    zoom: {
                        drag: {
                            backgroundColor: `${colors.primaryWarning}33`,
                            borderColor: `${colors.primaryWarning}CC`,
                            borderWidth: 2,
                            enabled: true,
                            modifierKey: "shift",
                        },
                        mode: "x",
                        pinch: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                            modifierKey: "ctrl",
                            speed: 0.1,
                        },
                    },
                },
            },
            responsive: true,
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: colors.grid,
                        display: showGrid,
                    },
                    ticks: { color: colors.text },
                    title: {
                        color: colors.text,
                        display: true,
                        text: `Distance (${getUnitSymbol("distance")})`,
                    },
                    type: "linear",
                },
                y: {
                    display: true,
                    grid: {
                        color: colors.grid,
                        display: showGrid,
                    },
                    ticks: { color: colors.text },
                    title: {
                        color: colors.text,
                        display: true,
                        text: `Speed (${getUnitSymbol("speed")})`,
                    },
                    type: "linear",
                },
            },
        },
        plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        type: "scatter",
    };
}

function convertDistanceForTooltip(
    parsedDistance: number,
    distanceUnits: string
): number {
    switch (distanceUnits) {
        case "feet": {
            return parsedDistance / FEET_PER_METER;
        }
        case "kilometers": {
            return parsedDistance / KILOMETERS_PER_METER;
        }
        case "miles": {
            return parsedDistance * METERS_PER_MILE;
        }
        default: {
            return parsedDistance;
        }
    }
}

function convertSpeedForTooltip(
    parsedSpeed: number,
    distanceUnits: string
): number {
    if (distanceUnits === "miles" || distanceUnits === "feet") {
        return parsedSpeed / MPH_PER_MPS;
    }

    return parsedSpeed / 3.6;
}

function createSpeedDistancePoints(
    data: readonly SpeedDistanceDatum[]
): SpeedDistancePoint[] {
    const points: SpeedDistancePoint[] = [];

    for (const { distance, enhancedSpeed, speed } of data) {
        const preferredSpeed = getFiniteNumber(enhancedSpeed ?? speed),
            numericDistance = getFiniteNumber(distance);

        if (preferredSpeed === null || numericDistance === null) {
            continue;
        }

        const convertedDistance = getConvertedNumber(
                numericDistance,
                "distance"
            ),
            convertedSpeed = getConvertedNumber(preferredSpeed, "speed");

        points.push({
            x: convertedDistance,
            y: roundSpeed(convertedSpeed),
        });
    }

    return points;
}

function formatSpeedDistanceTooltip(
    context: SpeedDistanceTooltipContext,
    distanceUnits: string
): string[] {
    const parsedDistance = toFiniteNumber(context.parsed.x),
        parsedSpeed = toFiniteNumber(context.parsed.y),
        rawDistance = convertDistanceForTooltip(parsedDistance, distanceUnits),
        rawSpeed = convertSpeedForTooltip(parsedSpeed, distanceUnits);

    return [
        `Distance: ${formatTooltipWithUnits(rawDistance, "distance")}`,
        `Speed: ${formatTooltipWithUnits(rawSpeed, "speed")}`,
    ];
}

function getAnimationDuration(animationStyle: string): number {
    if (animationStyle === "none") {
        return 0;
    }

    if (animationStyle === "fast") {
        return 500;
    }

    if (animationStyle === "slow") {
        return 2000;
    }

    return 1000;
}

function getConvertedNumber(
    value: number,
    field: "distance" | "speed"
): number {
    const convertedValue = convertValueToUserUnits(value, field);
    return typeof convertedValue === "number" && Number.isFinite(convertedValue)
        ? convertedValue
        : value;
}

function getFiniteNumber(value: unknown): null | number {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getSpeedDistanceInterpolationConfig(
    interpolation: string,
    smoothing: number
): {
    readonly cubicInterpolationMode: "default" | "monotone";
    readonly stepped: boolean;
    readonly tension: number;
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
            tension: smoothing,
        };
    }

    return {
        cubicInterpolationMode: "default",
        stepped: false,
        tension: smoothing,
    };
}

function getSpeedDistanceThemeColors(
    currentTheme: ChartTheme
): SpeedDistanceThemeColors {
    const colors = getThemeColors(),
        isDark = currentTheme === "dark";

    return {
        background: isDark ? DEFAULT_DARK_BACKGROUND : DEFAULT_LIGHT_BACKGROUND,
        chartBackground:
            getStringColor(colors, "chartBackground") ??
            (isDark ? DEFAULT_DARK_BACKGROUND : DEFAULT_LIGHT_BACKGROUND),
        chartBorder:
            getStringColor(colors, "chartBorder") ??
            (isDark ? DEFAULT_DARK_BORDER : DEFAULT_LIGHT_BORDER),
        chartSurface:
            getStringColor(colors, "chartSurface") ??
            (isDark ? DEFAULT_DARK_SURFACE : DEFAULT_LIGHT_SURFACE),
        grid:
            getStringColor(colors, "chartGrid") ??
            getStringColor(colors, "gridLines") ??
            (isDark ? DEFAULT_DARK_GRID : DEFAULT_LIGHT_GRID),
        primaryWarning: getStringColor(colors, "warning") ?? DEFAULT_WARNING,
        shadow: getStringColor(colors, "shadow") ?? DEFAULT_SHADOW,
        text: isDark ? DEFAULT_DARK_TEXT : DEFAULT_LIGHT_TEXT,
    };
}

function getStringColor(
    colors: ThemeColorMap | undefined,
    key: string
): string | undefined {
    const value = colors?.[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getThemeColors(): ThemeColorMap | undefined {
    try {
        return getThemeConfig().colors;
    } catch {
        return undefined;
    }
}

function hasSpeedAndDistance(data: readonly SpeedDistanceDatum[]): boolean {
    const hasDistance = data.some(
            ({ distance }) => getFiniteNumber(distance) !== null
        ),
        hasSpeed = data.some(
            ({ enhancedSpeed, speed }) =>
                getFiniteNumber(enhancedSpeed ?? speed) !== null
        );

    return hasSpeed && hasDistance;
}

function limitSpeedDistancePoints(
    chartData: readonly SpeedDistancePoint[],
    maxPoints: "all" | number
): SpeedDistancePoint[] {
    if (
        maxPoints === "all" ||
        !Number.isFinite(maxPoints) ||
        maxPoints <= 0 ||
        chartData.length <= maxPoints
    ) {
        return [...chartData];
    }

    const step = Math.ceil(chartData.length / maxPoints);
    return chartData.filter((_point, index) => index % step === 0);
}

function resolveChartTheme(theme: string): ChartTheme {
    if (theme === "dark" || theme === "light") {
        return theme;
    }

    return detectCurrentTheme();
}

function roundSpeed(speed: number): number {
    return (
        Math.round((speed + Number.EPSILON) * SPEED_ROUNDING_FACTOR) /
        SPEED_ROUNDING_FACTOR
    );
}

function toFiniteNumber(value: unknown): number {
    const numericValue = getFiniteNumber(value);
    return numericValue ?? 0;
}

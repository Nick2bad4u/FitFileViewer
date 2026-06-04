import { convertTimeUnits } from "../../formatting/converters/convertTimeUnits.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
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

interface AltitudeProfileDatum {
    readonly altitude?: null | unknown;
    readonly enhancedAltitude?: null | unknown;
}

interface AltitudeProfileOptions {
    readonly animationStyle?: string;
    readonly distanceUnits?: string;
    readonly interpolation?: string;
    readonly maxPoints: "all" | number;
    readonly showFill?: boolean;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showTitle?: boolean;
    readonly smoothing?: number;
    readonly theme?: string;
    readonly timeUnits?: string;
}

interface AltitudeProfilePoint {
    readonly x: number;
    readonly y: number;
}

interface AltitudeProfileThemeColors {
    readonly background: string;
    readonly chartBackground: string;
    readonly chartBorder: string;
    readonly chartSurface: string;
    readonly grid: string;
    readonly primary: string;
    readonly primaryAlpha: string;
    readonly shadow: string;
    readonly success: string;
    readonly text: string;
}

interface AltitudeProfileTooltipContext {
    readonly parsed: {
        readonly y: number;
    };
}

interface AltitudeProfileTooltipTitleContext {
    readonly parsed: {
        readonly x: number;
    };
}

const DEFAULT_DARK_BACKGROUND = "#181c24",
    DEFAULT_DARK_BORDER = "#555",
    DEFAULT_DARK_GRID = "rgba(255,255,255,0.1)",
    DEFAULT_DARK_SURFACE = "#222",
    DEFAULT_DARK_TEXT = "#fff",
    DEFAULT_LIGHT_BACKGROUND = "#ffffff",
    DEFAULT_LIGHT_BORDER = "#cccccc",
    DEFAULT_LIGHT_GRID = "rgba(0,0,0,0.1)",
    DEFAULT_LIGHT_SURFACE = "#f5f5f5",
    DEFAULT_LIGHT_TEXT = "#000000",
    DEFAULT_PRIMARY = "#0066cc",
    DEFAULT_PRIMARY_ALPHA = "#0066cc33",
    DEFAULT_SHADOW = "#00000020",
    DEFAULT_SUCCESS = "#10b981";

/**
 * Render a line chart showing activity altitude over time.
 */
export function renderAltitudeProfileChart(
    container: HTMLElement,
    data: readonly AltitudeProfileDatum[],
    labels: readonly (number | string)[],
    options: AltitudeProfileOptions
): void {
    try {
        const {
            animationStyle = "normal",
            distanceUnits = "kilometers",
            interpolation = "linear",
            maxPoints,
            showFill = true,
            showGrid,
            showLegend,
            showTitle,
            smoothing = 0.1,
            theme = "auto",
            timeUnits = "seconds",
        } = options;

        if (!hasAltitudeData(data)) {
            return;
        }

        if (
            chartSettingsManager.getFieldVisibility("altitude_profile") ===
            "hidden"
        ) {
            return;
        }

        const currentTheme = resolveChartTheme(theme),
            colors = getAltitudeProfileThemeColors(currentTheme);

        let chartData = createAltitudeProfilePoints(
            data,
            labels,
            distanceUnits
        );

        if (chartData.length === 0) {
            return;
        }

        chartData = limitAltitudeProfilePoints(chartData, maxPoints);

        const canvas = createChartCanvas("altitude-profile", 0);
        canvas.style.background = colors.background;
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = `0 2px 16px 0 ${colors.shadow}`;
        container.append(canvas);

        const chart = createManagedChart(
            canvas,
            createAltitudeProfileConfig({
                animationStyle,
                chartData,
                colors,
                distanceUnits,
                interpolation,
                showFill,
                showGrid,
                showLegend,
                showTitle,
                smoothing,
                timeUnits,
            })
        );

        if (chart) {
            console.log(
                "[ChartJS] Altitude Profile chart created successfully"
            );
        }
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering altitude profile chart:",
            error
        );
    }
}

function createAltitudeProfileConfig({
    animationStyle,
    chartData,
    colors,
    distanceUnits,
    interpolation,
    showFill,
    showGrid,
    showLegend,
    showTitle,
    smoothing,
    timeUnits,
}: {
    readonly animationStyle: string;
    readonly chartData: readonly AltitudeProfilePoint[];
    readonly colors: AltitudeProfileThemeColors;
    readonly distanceUnits: string;
    readonly interpolation: string;
    readonly showFill: boolean;
    readonly showGrid: boolean | undefined;
    readonly showLegend: boolean | undefined;
    readonly showTitle: boolean | undefined;
    readonly smoothing: number;
    readonly timeUnits: string;
}): ManagedChartConfig {
    const interpolationConfig = getAltitudeProfileInterpolationConfig(
            interpolation,
            smoothing
        ),
        altitudeUnit = getAltitudeUnit(distanceUnits);

    return {
        data: {
            datasets: [
                {
                    backgroundColor: `${colors.success}4D`,
                    borderColor: colors.success,
                    borderWidth: 2,
                    cubicInterpolationMode:
                        interpolationConfig.cubicInterpolationMode,
                    data: chartData,
                    fill: showFill ? "origin" : false,
                    label: "Altitude Profile",
                    pointHoverRadius: 4,
                    pointRadius: 0,
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
                    text: "Altitude Profile",
                },
                tooltip: {
                    backgroundColor: colors.chartSurface,
                    bodyColor: colors.text,
                    borderColor: colors.chartBorder,
                    borderWidth: 1,
                    callbacks: {
                        label(context: AltitudeProfileTooltipContext): string {
                            return `Altitude: ${context.parsed.y.toFixed(1)} ${altitudeUnit}`;
                        },
                        title(
                            context: readonly AltitudeProfileTooltipTitleContext[]
                        ): string {
                            const firstContext = context[0];
                            if (!firstContext) {
                                return "Time: 0:00";
                            }

                            return formatTooltipTimeLabel(
                                firstContext.parsed.x,
                                timeUnits
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
                            backgroundColor: colors.primaryAlpha,
                            borderColor: `${colors.primary}CC`,
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
                    ticks: {
                        callback(value: number): string {
                            return formatTickTimeLabel(value, timeUnits);
                        },
                        color: colors.text,
                    },
                    title: {
                        color: colors.text,
                        display: true,
                        text: `Time (${getTimeAxisUnitLabel(timeUnits)})`,
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
                        text: `Altitude (${altitudeUnit})`,
                    },
                    type: "linear",
                },
            },
        },
        plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        type: "line",
    };
}

function createAltitudeProfilePoints(
    data: readonly AltitudeProfileDatum[],
    labels: readonly (number | string)[],
    distanceUnits: string
): AltitudeProfilePoint[] {
    const points: AltitudeProfilePoint[] = [];

    for (const [index, row] of data.entries()) {
        const altitude = getFiniteNumber(row.enhancedAltitude ?? row.altitude),
            label = labels[index];

        if (
            altitude === null ||
            typeof label !== "number" ||
            !Number.isFinite(label)
        ) {
            continue;
        }

        points.push({
            x: label,
            y: convertAltitudeToDisplayUnit(altitude, distanceUnits),
        });
    }

    return points;
}

function convertAltitudeToDisplayUnit(
    altitudeMeters: number,
    distanceUnits: string
): number {
    return usesImperialAltitude(distanceUnits)
        ? altitudeMeters * 3.280_84
        : altitudeMeters;
}

function formatTickTimeLabel(seconds: number, timeUnits: string): string {
    const converted = convertTimeUnits(seconds, timeUnits);

    if (timeUnits === "hours") {
        return `${converted.toFixed(2)}h`;
    }

    if (timeUnits === "minutes") {
        return `${converted.toFixed(1)}m`;
    }

    return formatTime(seconds, true);
}

function formatTooltipTimeLabel(seconds: number, timeUnits: string): string {
    const converted = convertTimeUnits(seconds, timeUnits);

    if (timeUnits === "hours") {
        return `Time: ${converted.toFixed(2)}h`;
    }

    if (timeUnits === "minutes") {
        return `Time: ${converted.toFixed(1)}m`;
    }

    return `Time: ${formatTime(seconds)}`;
}

function getAltitudeProfileInterpolationConfig(
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

function getAltitudeProfileThemeColors(
    currentTheme: ChartTheme
): AltitudeProfileThemeColors {
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
        primary: getStringColor(colors, "primary") ?? DEFAULT_PRIMARY,
        primaryAlpha:
            getStringColor(colors, "primaryAlpha") ?? DEFAULT_PRIMARY_ALPHA,
        shadow: getStringColor(colors, "shadow") ?? DEFAULT_SHADOW,
        success: getStringColor(colors, "success") ?? DEFAULT_SUCCESS,
        text: isDark ? DEFAULT_DARK_TEXT : DEFAULT_LIGHT_TEXT,
    };
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

function getAltitudeUnit(distanceUnits: string): "ft" | "m" {
    return usesImperialAltitude(distanceUnits) ? "ft" : "m";
}

function getFiniteNumber(value: unknown): null | number {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function getTimeAxisUnitLabel(timeUnits: string): "h" | "min" | "s" {
    if (timeUnits === "hours") {
        return "h";
    }

    if (timeUnits === "minutes") {
        return "min";
    }

    return "s";
}

function hasAltitudeData(data: readonly AltitudeProfileDatum[]): boolean {
    return data.some(
        ({ altitude, enhancedAltitude }) =>
            getFiniteNumber(enhancedAltitude ?? altitude) !== null
    );
}

function limitAltitudeProfilePoints(
    chartData: readonly AltitudeProfilePoint[],
    maxPoints: "all" | number
): AltitudeProfilePoint[] {
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

function usesImperialAltitude(distanceUnits: string): boolean {
    return distanceUnits === "feet" || distanceUnits === "miles";
}

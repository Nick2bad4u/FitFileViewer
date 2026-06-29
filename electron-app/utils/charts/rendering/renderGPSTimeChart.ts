import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { isChartDebugLoggingEnabled } from "../core/chartDebugState.js";
import {
    createManagedChart,
    type ManagedChartConfig,
} from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { isTestEnvironment } from "../core/renderChartRuntimeHelpers.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

interface GPSTimeChartOptions {
    readonly maxPoints: "all" | number;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showPoints?: boolean;
    readonly showTitle?: boolean;
}

interface GPSTimePoint {
    readonly elapsedSeconds: number;
    readonly pointIndex: number;
    readonly timestamp: Date | number | string;
    readonly x: number;
    readonly y: number;
}

interface GPSTimeThemeColors {
    readonly background: string;
    readonly chartBackground: string;
    readonly chartBorder: string;
    readonly chartSurface: string;
    readonly gridLines: string;
    readonly primary: string;
    readonly primaryAlpha: string;
    readonly shadow: string;
    readonly success: string;
    readonly text: string;
    readonly textPrimary: string;
}

interface GPSTimeTooltipContext {
    readonly datasetIndex: number;
    readonly raw: GPSTimePoint;
}

interface NormalizedGPSTimeDatum {
    readonly positionLat: number;
    readonly positionLong: number;
    readonly timestamp: Date | number | string;
    readonly timestampMillis: number;
}

const DEFAULT_BACKGROUND = "#000",
    DEFAULT_BORDER = "#333333",
    DEFAULT_GRID = "#222222",
    DEFAULT_PRIMARY = "#1677ff",
    DEFAULT_PRIMARY_ALPHA = "rgba(22, 119, 255, 0.25)",
    DEFAULT_SHADOW = "0 2px 16px rgba(0,0,0,0.2)",
    DEFAULT_SUCCESS = "#13c2c2",
    DEFAULT_SURFACE = "#1c1c1c",
    DEFAULT_TEXT = "#f5f5f5",
    DEFAULT_TEXT_PRIMARY = "#e8e8e8",
    SEMICIRCLE_DEGREES_FACTOR = 180 / 2 ** 31;

/**
 * Renders GPS latitude and longitude over elapsed activity time.
 */
export function renderGPSTimeChart(
    container: HTMLElement,
    data: readonly unknown[],
    options: GPSTimeChartOptions
): void {
    try {
        const isDebugLoggingEnabled = shouldLogDebugMessages();
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderGPSTimeChart called");
        }

        const normalizedData = getGpsTimeRows(data);

        if (normalizedData.length === 0) {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] No GPS position or timestamp data available"
                );
            }
            return;
        }

        if (chartSettingsManager.getFieldVisibility("gps_time") === "hidden") {
            return;
        }

        const [firstRow] = normalizedData;
        if (!firstRow) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No valid timestamp found");
            }
            return;
        }

        let { latitudeData, longitudeData } = createGpsTimeDataSets(
            normalizedData,
            firstRow.timestampMillis
        );

        if (latitudeData.length === 0 || longitudeData.length === 0) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No valid GPS time data points found");
            }
            return;
        }

        ({ latitudeData, longitudeData } = limitGpsTimePoints(
            latitudeData,
            longitudeData,
            options.maxPoints
        ));

        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Creating GPS time chart with ${latitudeData.length} points`
            );
        }

        const colors = getGpsTimeThemeColors(),
            canvas = createChartCanvas("gps-time", 0);

        canvas.style.background = colors.background;
        canvas.style.boxShadow = colors.shadow;
        canvas.style.borderRadius = "12px";
        container.append(canvas);

        const chart = createManagedChart(
            canvas,
            createGpsTimeChartConfig(
                latitudeData,
                longitudeData,
                colors,
                options
            )
        );

        if (chart) {
            console.log("[ChartJS] GPS time chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering GPS time chart:", error);
    }
}

function createGpsTimeChartConfig(
    latitudeData: readonly GPSTimePoint[],
    longitudeData: readonly GPSTimePoint[],
    colors: GPSTimeThemeColors,
    options: GPSTimeChartOptions
): ManagedChartConfig {
    return {
        data: {
            datasets: [
                {
                    backgroundColor: colors.primaryAlpha,
                    borderColor: colors.primary,
                    borderWidth: 2,
                    data: latitudeData,
                    fill: false,
                    label: "Latitude",
                    pointHoverRadius: 6,
                    pointRadius: options.showPoints === true ? 2 : 1,
                    showLine: true,
                    tension: 0.1,
                    yAxisID: "y",
                },
                {
                    backgroundColor: `${colors.success}33`,
                    borderColor: colors.success,
                    borderWidth: 2,
                    data: longitudeData,
                    fill: false,
                    label: "Longitude",
                    pointHoverRadius: 6,
                    pointRadius: options.showPoints === true ? 2 : 1,
                    showLine: true,
                    tension: 0.1,
                    yAxisID: "y1",
                },
            ],
        },
        options: {
            interaction: {
                intersect: false,
                mode: "index",
            },
            maintainAspectRatio: false,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: colors.chartBackground,
                },
                legend: {
                    display: options.showLegend !== false,
                    labels: { color: colors.text },
                },
                title: {
                    color: colors.text,
                    display: options.showTitle !== false,
                    font: { size: 16, weight: "bold" },
                    text: "GPS Position vs Time",
                },
                tooltip: {
                    backgroundColor: colors.chartSurface,
                    bodyColor: colors.text,
                    borderColor: colors.chartBorder,
                    borderWidth: 1,
                    callbacks: {
                        label(context: GPSTimeTooltipContext): string[] {
                            const point = context.raw,
                                coordType =
                                    context.datasetIndex === 0
                                        ? "Latitude"
                                        : "Longitude";

                            return [
                                `${coordType}: ${point.y.toFixed(6)}°`,
                                `Elapsed: ${formatElapsedTime(point.elapsedSeconds)}`,
                                `Point: ${point.pointIndex}`,
                            ];
                        },
                        title(
                            tooltipItems: readonly GPSTimeTooltipContext[]
                        ): string {
                            const firstItem = tooltipItems[0];
                            return firstItem
                                ? new Date(
                                      firstItem.raw.timestamp
                                  ).toLocaleString()
                                : "";
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
                        mode: "xy",
                        modifierKey: null,
                    },
                    zoom: {
                        drag: {
                            backgroundColor: colors.primaryAlpha,
                            borderColor: colors.primary,
                            borderWidth: 2,
                            enabled: true,
                            modifierKey: "shift",
                        },
                        mode: "xy",
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
                        color: colors.gridLines,
                        display: options.showGrid !== false,
                    },
                    ticks: {
                        callback(value: number): string {
                            return formatElapsedTime(value);
                        },
                        color: colors.textPrimary,
                    },
                    title: {
                        color: colors.textPrimary,
                        display: true,
                        text: "Elapsed Time",
                    },
                    type: "linear",
                },
                y: {
                    display: true,
                    grid: {
                        color: colors.gridLines,
                        display: options.showGrid !== false,
                    },
                    position: "left",
                    ticks: {
                        callback(value: number): string {
                            return `${value.toFixed(5)}°`;
                        },
                        color: colors.primary,
                    },
                    title: {
                        color: colors.primary,
                        display: true,
                        text: "Latitude (°)",
                    },
                    type: "linear",
                },
                y1: {
                    display: true,
                    grid: {
                        display: false,
                        drawOnChartArea: false,
                    },
                    position: "right",
                    ticks: {
                        callback(value: number): string {
                            return `${value.toFixed(5)}°`;
                        },
                        color: colors.success,
                    },
                    title: {
                        color: colors.success,
                        display: true,
                        text: "Longitude (°)",
                    },
                    type: "linear",
                },
            },
        },
        plugins: [chartZoomResetPlugin, "chartBackgroundColorPlugin"],
        type: "line",
    };
}

function createGpsTimeDataSets(
    normalizedData: readonly NormalizedGPSTimeDatum[],
    startTimeMillis: number
): {
    readonly latitudeData: GPSTimePoint[];
    readonly longitudeData: GPSTimePoint[];
} {
    const latitudeData: GPSTimePoint[] = [],
        longitudeData: GPSTimePoint[] = [];

    for (const [index, row] of normalizedData.entries()) {
        const elapsedSeconds = (row.timestampMillis - startTimeMillis) / 1000;

        latitudeData.push({
            elapsedSeconds,
            pointIndex: index,
            timestamp: row.timestamp,
            x: elapsedSeconds,
            y: row.positionLat * SEMICIRCLE_DEGREES_FACTOR,
        });
        longitudeData.push({
            elapsedSeconds,
            pointIndex: index,
            timestamp: row.timestamp,
            x: elapsedSeconds,
            y: row.positionLong * SEMICIRCLE_DEGREES_FACTOR,
        });
    }

    return { latitudeData, longitudeData };
}

function formatElapsedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600),
        minutes = Math.floor((seconds % 3600) / 60),
        secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
}

function getFiniteNumber(value: unknown): null | number {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getGpsTimeRows(data: readonly unknown[]): NormalizedGPSTimeDatum[] {
    if (!Array.isArray(data)) {
        return [];
    }

    const rows: NormalizedGPSTimeDatum[] = [];

    for (const row of data) {
        if (!isObjectRecord(row)) {
            continue;
        }

        const positionLat = getFiniteNumber(row["positionLat"]),
            positionLong = getFiniteNumber(row["positionLong"]),
            timestamp = row["timestamp"],
            timestampMillis = getTimestampMillis(timestamp);

        if (
            positionLat === null ||
            positionLong === null ||
            !isTimestampValue(timestamp) ||
            timestampMillis === null
        ) {
            continue;
        }

        rows.push({
            positionLat,
            positionLong,
            timestamp,
            timestampMillis,
        });
    }

    return rows;
}

function getGpsTimeThemeColors(): GPSTimeThemeColors {
    const colors = getThemeColors();

    return {
        background:
            getStringColor(colors, "bgPrimary") ??
            getStringColor(colors, "chartBackground") ??
            DEFAULT_BACKGROUND,
        chartBackground:
            getStringColor(colors, "chartBackground") ?? DEFAULT_BACKGROUND,
        chartBorder: getStringColor(colors, "chartBorder") ?? DEFAULT_BORDER,
        chartSurface: getStringColor(colors, "chartSurface") ?? DEFAULT_SURFACE,
        gridLines: getStringColor(colors, "gridLines") ?? DEFAULT_GRID,
        primary: getStringColor(colors, "primary") ?? DEFAULT_PRIMARY,
        primaryAlpha:
            getStringColor(colors, "primaryAlpha") ?? DEFAULT_PRIMARY_ALPHA,
        shadow: getStringColor(colors, "shadow") ?? DEFAULT_SHADOW,
        success: getStringColor(colors, "success") ?? DEFAULT_SUCCESS,
        text: getStringColor(colors, "text") ?? DEFAULT_TEXT,
        textPrimary:
            getStringColor(colors, "textPrimary") ?? DEFAULT_TEXT_PRIMARY,
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

function getTimestampMillis(value: unknown): null | number {
    if (
        typeof value !== "number" &&
        typeof value !== "string" &&
        !(value instanceof Date)
    ) {
        return null;
    }

    const timestampMillis = new Date(value).getTime();
    return Number.isFinite(timestampMillis) ? timestampMillis : null;
}

function isTimestampValue(value: unknown): value is Date | number | string {
    return (
        typeof value === "number" ||
        typeof value === "string" ||
        value instanceof Date
    );
}

function limitGpsTimePoints(
    latitudeData: readonly GPSTimePoint[],
    longitudeData: readonly GPSTimePoint[],
    maxPoints: "all" | number
): {
    readonly latitudeData: GPSTimePoint[];
    readonly longitudeData: GPSTimePoint[];
} {
    if (
        maxPoints === "all" ||
        !Number.isFinite(maxPoints) ||
        maxPoints <= 0 ||
        latitudeData.length <= maxPoints
    ) {
        return {
            latitudeData: [...latitudeData],
            longitudeData: [...longitudeData],
        };
    }

    const step = Math.ceil(latitudeData.length / maxPoints);

    return {
        latitudeData: latitudeData.filter(
            (_point, index) => index % step === 0
        ),
        longitudeData: longitudeData.filter(
            (_point, index) => index % step === 0
        ),
    };
}

function shouldLogDebugMessages(): boolean {
    return isTestEnvironment() || isChartDebugLoggingEnabled();
}

import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
const DEFAULT_BACKGROUND = "#181c24",
    DEFAULT_BORDER = "#444444",
    DEFAULT_GRID = "rgba(255,255,255,0.12)",
    DEFAULT_PRIMARY = "#007bff",
    DEFAULT_PRIMARY_ALPHA = "rgba(0, 123, 255, 0.2)",
    DEFAULT_SHADOW = "0 2px 8px rgba(0,0,0,0.1)",
    DEFAULT_SURFACE = "#23263a",
    DEFAULT_TEXT = "#ffffff",
    SEMICIRCLE_DEGREES_FACTOR = 180 / 2 ** 31;
/**
 * Render a scatter chart showing GPS track coordinates.
 */
export function renderGPSTrackChart(container, data, options) {
    try {
        const isDebugLoggingEnabled = shouldLogDebugMessages();
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderGPSTrackChart called");
        }
        if (!(container instanceof HTMLElement)) {
            return;
        }
        const safeData = getGpsRows(data),
            hasLatitude = safeData.some((row) => row.positionLat !== null),
            hasLongitude = safeData.some((row) => row.positionLong !== null);
        if (!hasLatitude || !hasLongitude) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No GPS position data available");
            }
            return;
        }
        if (chartSettingsManager.getFieldVisibility("gps_track") === "hidden") {
            return;
        }
        let gpsData = createGpsTrackPoints(safeData);
        if (gpsData.length === 0) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No valid GPS data points found");
            }
            return;
        }
        gpsData = limitGpsTrackPoints(gpsData, options.maxPoints);
        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Creating GPS track chart with ${gpsData.length} points`
            );
        }
        const colors = getGpsTrackThemeColors(),
            canvas = createChartCanvas("gps-track", 0);
        canvas.style.background = colors.background;
        canvas.style.boxShadow = colors.shadow;
        canvas.style.borderRadius = "12px";
        container.append(canvas);
        const chart = createManagedChart(
            canvas,
            createGpsTrackChartConfig(gpsData, colors, options)
        );
        if (chart) {
            console.log("[ChartJS] GPS track chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering GPS track chart:", error);
    }
}
function createGpsTrackChartConfig(gpsData, colors, options) {
    return {
        data: {
            datasets: [
                {
                    backgroundColor: colors.primaryAlpha,
                    borderColor: colors.primary,
                    borderWidth: 2,
                    data: gpsData,
                    fill: false,
                    label: "GPS Track",
                    pointHoverRadius: 4,
                    pointRadius: options.showPoints === true ? 2 : 1,
                    showLine: true,
                    tension: 0.1,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: colors.chartBackground,
                },
                legend: {
                    display: options.showLegend,
                    labels: { color: colors.text },
                },
                title: {
                    color: colors.text,
                    display: options.showTitle,
                    font: { size: 16, weight: "bold" },
                    text: "GPS Track",
                },
                tooltip: {
                    backgroundColor: colors.chartSurface,
                    bodyColor: colors.text,
                    borderColor: colors.chartBorder,
                    borderWidth: 1,
                    callbacks: {
                        label(context) {
                            const point = context.raw;
                            return [
                                `Latitude: ${point.y.toFixed(6)}°`,
                                `Longitude: ${point.x.toFixed(6)}°`,
                                `Point: ${point.pointIndex}`,
                            ];
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
                        display: options.showGrid,
                    },
                    ticks: {
                        callback(value) {
                            return `${value.toFixed(4)}°`;
                        },
                        color: colors.textPrimary,
                    },
                    title: {
                        color: colors.textPrimary,
                        display: true,
                        text: "Longitude (°)",
                    },
                    type: "linear",
                },
                y: {
                    display: true,
                    grid: {
                        color: colors.gridLines,
                        display: options.showGrid,
                    },
                    ticks: {
                        callback(value) {
                            return `${value.toFixed(4)}°`;
                        },
                        color: colors.textPrimary,
                    },
                    title: {
                        color: colors.textPrimary,
                        display: true,
                        text: "Latitude (°)",
                    },
                    type: "linear",
                },
            },
        },
        plugins: [chartZoomResetPlugin, "chartBackgroundColorPlugin"],
        type: "scatter",
    };
}
function createGpsTrackPoints(data) {
    const points = [];
    for (const [index, row] of data.entries()) {
        if (row.positionLat === null || row.positionLong === null) {
            continue;
        }
        points.push({
            pointIndex: index,
            x: row.positionLong * SEMICIRCLE_DEGREES_FACTOR,
            y: row.positionLat * SEMICIRCLE_DEGREES_FACTOR,
        });
    }
    return points;
}
function getGpsRows(data) {
    if (!Array.isArray(data)) {
        return [];
    }
    return data.filter(isObjectRecord).map((row) => ({
        positionLat: getFiniteNumber(row["positionLat"]),
        positionLong: getFiniteNumber(row["positionLong"]),
    }));
}
function getFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function getGpsTrackThemeColors() {
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
        text: getStringColor(colors, "text") ?? DEFAULT_TEXT,
        textPrimary: getStringColor(colors, "textPrimary") ?? DEFAULT_TEXT,
    };
}
function getStringColor(colors, key) {
    const value = colors?.[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
function getThemeColors() {
    try {
        return getThemeConfig().colors;
    } catch {
        return undefined;
    }
}
function limitGpsTrackPoints(gpsData, maxPoints) {
    if (
        maxPoints === "all" ||
        !Number.isFinite(maxPoints) ||
        maxPoints <= 0 ||
        gpsData.length <= maxPoints
    ) {
        return [...gpsData];
    }
    const step = Math.ceil(gpsData.length / maxPoints);
    return gpsData.filter((_point, index) => index % step === 0);
}
function shouldLogDebugMessages() {
    const isTestEnvironment =
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test",
        isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "development",
        runtimeGlobal = globalThis;
    return (
        isTestEnvironment ||
        (isDevEnvironment && Boolean(runtimeGlobal.__FFV_debugCharts))
    );
}

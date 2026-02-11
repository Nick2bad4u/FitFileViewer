import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// GPS track chart renderer
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{
 *     maxPoints: number | "all";
 *     showPoints?: boolean;
 *     showLegend?: boolean;
 *     showTitle?: boolean;
 *     showGrid?: boolean;
 * }} options
 */
export function renderGPSTrackChart(container, data, options) {
    try {
        const isTestEnvironment =
            typeof process !== "undefined" && process.env?.NODE_ENV === "test";
        const isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.NODE_ENV === "development";
        const isDebugLoggingEnabled =
            isTestEnvironment ||
            (isDevEnvironment &&
                Boolean(/** @type {any} */ (globalThis).__FFV_debugCharts));
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderGPSTrackChart called");
        }

        // Defensive: FIT record arrays can contain null/undefined entries in edge cases.
        const safeData = Array.isArray(data)
            ? data.filter((row) => row && typeof row === "object")
            : [];

        // Check if GPS position data is available
        const hasLatitude = safeData.some(
                (row) =>
                    row.positionLat !== undefined && row.positionLat !== null
            ),
            hasLongitude = safeData.some(
                (row) =>
                    row.positionLong !== undefined && row.positionLong !== null
            );

        if (!hasLatitude || !hasLongitude) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No GPS position data available");
            }
            return;
        }

        // Check field visibility via centralized settings manager
        const visibility = chartSettingsManager.getFieldVisibility("gps_track");
        if (visibility === "hidden") {
            return;
        }

        /** @type {any} */
        const themeConfig = getThemeConfig();

        // Convert GPS positions to chart data
        let gpsData = safeData
            .map((row, index) => {
                if (
                    row.positionLat !== undefined &&
                    row.positionLat !== null &&
                    row.positionLong !== undefined &&
                    row.positionLong !== null
                ) {
                    // Convert semicircle coordinates to degrees
                    const lat = (row.positionLat * 180) / 2 ** 31,
                        lng = (row.positionLong * 180) / 2 ** 31;

                    return {
                        pointIndex: index,
                        x: lng,
                        y: lat,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (gpsData.length === 0) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No valid GPS data points found");
            }
            return;
        }

        // Apply data point limiting
        if (options.maxPoints !== "all" && gpsData.length > options.maxPoints) {
            const step = Math.ceil(gpsData.length / options.maxPoints);
            gpsData = gpsData.filter((_, i) => i % step === 0);
        }

        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Creating GPS track chart with ${gpsData.length} points`
            );
        }

        const canvas = /** @type {HTMLCanvasElement} */ (
            createChartCanvas("gps-track", 0)
        );
        if (themeConfig?.colors) {
            canvas.style.background =
                themeConfig.colors.bgPrimary ||
                themeConfig.colors.chartBackground ||
                "#000";
            if (
                typeof themeConfig.colors.shadow === "string" &&
                themeConfig.colors.shadow.length > 0
            ) {
                canvas.style.boxShadow = themeConfig.colors.shadow;
            }
        }
        canvas.style.borderRadius = "12px";
        container.append(canvas);

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: themeConfig.colors.primaryAlpha,
                        borderColor: themeConfig.colors.primary,
                        borderWidth: 2,
                        data: gpsData,
                        fill: false,
                        label: "GPS Track",
                        pointHoverRadius: 4,
                        pointRadius: options.showPoints ? 2 : 1,
                        showLine: true,
                        tension: 0.1,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor: themeConfig.colors.chartBackground,
                    },
                    legend: {
                        display: options.showLegend,
                        labels: { color: themeConfig.colors.text },
                    },
                    title: {
                        color: themeConfig.colors.text,
                        display: options.showTitle,
                        font: { size: 16, weight: "bold" },
                        text: "GPS Track",
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        bodyColor: themeConfig.colors.text,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                const point = context.raw;
                                return [
                                    `Latitude: ${point.y.toFixed(6)}°`,
                                    `Longitude: ${point.x.toFixed(6)}°`,
                                    `Point: ${point.pointIndex}`,
                                ];
                            },
                        },
                        titleColor: themeConfig.colors.text,
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
                                backgroundColor:
                                    themeConfig.colors.primaryAlpha,
                                borderColor: themeConfig.colors.primary,
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
                            color: themeConfig.colors.gridLines,
                            display: options.showGrid,
                        },
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                return `${value.toFixed(4)}°`;
                            },
                            color: themeConfig.colors.textPrimary,
                        },
                        title: {
                            color: themeConfig.colors.textPrimary,
                            display: true,
                            text: "Longitude (°)",
                        },
                        type: "linear",
                    },
                    y: {
                        display: true,
                        grid: {
                            color: themeConfig.colors.gridLines,
                            display: options.showGrid,
                        },
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                return `${value.toFixed(4)}°`;
                            },
                            color: themeConfig.colors.textPrimary,
                        },
                        title: {
                            color: themeConfig.colors.textPrimary,
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

        const chart = createManagedChart(canvas, config);
        if (chart) {
            console.log("[ChartJS] GPS track chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering GPS track chart:", error);
    }
}

import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

/**
 * Renders a chart showing GPS position (latitude and longitude) plotted against time.
 * This allows users to correlate specific timestamps with exact GPS locations,
 * making it easy to identify where events like top speed occurred.
 *
 * @param {HTMLElement} container - Container element for the chart
 * @param {any[]} data - Array of record messages with position and timestamp data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options - Chart configuration options
 */
export function renderGPSTimeChart(container, data, options) {
    try {
        console.log("[ChartJS] renderGPSTimeChart called");

        // Check if GPS position and timestamp data are available
        const hasLatitude = data.some((row) => row.positionLat !== undefined && row.positionLat !== null),
            hasLongitude = data.some((row) => row.positionLong !== undefined && row.positionLong !== null),
            hasTimestamp = data.some((row) => row.timestamp !== undefined && row.timestamp !== null);

        if (!hasLatitude || !hasLongitude || !hasTimestamp) {
            console.log("[ChartJS] No GPS position or timestamp data available");
            return;
        }

        // Check field visibility via centralized settings manager
        const visibility = chartSettingsManager.getFieldVisibility("gps_time");
        if (visibility === "hidden") {
            return;
        }

        /** @type {any} */
        const themeConfig = getThemeConfig();

        // Find the first valid timestamp to use as reference time
        const firstTimestamp = data.find((row) => row.timestamp)?.timestamp;
        if (!firstTimestamp) {
            console.log("[ChartJS] No valid timestamp found");
            return;
        }

        const startTime = new Date(firstTimestamp).getTime();

        // Convert GPS positions and timestamps to chart data
        let latitudeData = [],
            longitudeData = [];
        for (const [index, row] of data.entries()) {
            if (
                row.positionLat !== undefined &&
                row.positionLat !== null &&
                row.positionLong !== undefined &&
                row.positionLong !== null &&
                row.timestamp
            ) {
                // Convert semicircle coordinates to degrees
                const lat = (row.positionLat * 180) / 2 ** 31,
                    lng = (row.positionLong * 180) / 2 ** 31,
                    // Calculate elapsed time in seconds
                    elapsedSeconds = (new Date(row.timestamp).getTime() - startTime) / 1000;

                latitudeData.push({
                    elapsedSeconds,
                    pointIndex: index,
                    timestamp: row.timestamp,
                    x: elapsedSeconds,
                    y: lat,
                });
                longitudeData.push({
                    elapsedSeconds,
                    pointIndex: index,
                    timestamp: row.timestamp,
                    x: elapsedSeconds,
                    y: lng,
                });
            }
        }

        if (latitudeData.length === 0 || longitudeData.length === 0) {
            console.log("[ChartJS] No valid GPS time data points found");
            return;
        }

        // Apply data point limiting
        if (options.maxPoints !== "all") {
            const maxPoints = typeof options.maxPoints === "number" ? options.maxPoints : 1000;
            if (latitudeData.length > maxPoints) {
                const step = Math.ceil(latitudeData.length / maxPoints);
                latitudeData = latitudeData.filter((_, i) => i % step === 0);
                longitudeData = longitudeData.filter((_, i) => i % step === 0);
            }
        }

        console.log(`[ChartJS] Creating GPS time chart with ${latitudeData.length} points`);

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("gps-time", 0));
        if (themeConfig?.colors) {
            canvas.style.background = themeConfig.colors.bgPrimary || themeConfig.colors.chartBackground || "#000";
            canvas.style.boxShadow = themeConfig.colors.shadow || "";
        }
        canvas.style.borderRadius = "12px";
        container.append(canvas);

        /**
         * Format elapsed seconds to human-readable time string
         * @param {number} seconds - Elapsed seconds
         * @returns {string} Formatted time string
         */
        function formatElapsedTime(seconds) {
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

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: themeConfig.colors.primaryAlpha,
                        borderColor: themeConfig.colors.primary,
                        borderWidth: 2,
                        data: latitudeData,
                        fill: false,
                        label: "Latitude",
                        pointHoverRadius: 6,
                        pointRadius: options.showPoints ? 2 : 1,
                        showLine: true,
                        tension: 0.1,
                        yAxisID: "y",
                    },
                    {
                        backgroundColor: `${themeConfig.colors.success}33`,
                        borderColor: themeConfig.colors.success,
                        borderWidth: 2,
                        data: longitudeData,
                        fill: false,
                        label: "Longitude",
                        pointHoverRadius: 6,
                        pointRadius: options.showPoints ? 2 : 1,
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
                        backgroundColor: themeConfig.colors.chartBackground,
                    },
                    legend: {
                        display: options.showLegend !== false,
                        labels: { color: themeConfig.colors.text },
                    },
                    title: {
                        color: themeConfig.colors.text,
                        display: options.showTitle !== false,
                        font: { size: 16, weight: "bold" },
                        text: "GPS Position vs Time",
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        bodyColor: themeConfig.colors.text,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                const point = context.raw,
                                    isLatitude = context.datasetIndex === 0,
                                    coordType = isLatitude ? "Latitude" : "Longitude";

                                return [
                                    `${coordType}: ${point.y.toFixed(6)}°`,
                                    `Elapsed: ${formatElapsedTime(point.elapsedSeconds)}`,
                                    `Point: ${point.pointIndex}`,
                                ];
                            },
                            /** @param {any[]} tooltipItems */
                            title(tooltipItems) {
                                if (tooltipItems.length > 0) {
                                    const point = tooltipItems[0].raw;
                                    return new Date(point.timestamp).toLocaleString();
                                }
                                return "";
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
                                backgroundColor: themeConfig.colors.primaryAlpha,
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
                            display: options.showGrid !== false,
                        },
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                return formatElapsedTime(value);
                            },
                            color: themeConfig.colors.textPrimary,
                        },
                        title: {
                            color: themeConfig.colors.textPrimary,
                            display: true,
                            text: "Elapsed Time",
                        },
                        type: "linear",
                    },
                    y: {
                        display: true,
                        grid: {
                            color: themeConfig.colors.gridLines,
                            display: options.showGrid !== false,
                        },
                        position: "left",
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                return `${value.toFixed(5)}°`;
                            },
                            color: themeConfig.colors.primary,
                        },
                        title: {
                            color: themeConfig.colors.primary,
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
                            /** @param {any} value */
                            callback(value) {
                                return `${value.toFixed(5)}°`;
                            },
                            color: themeConfig.colors.success,
                        },
                        title: {
                            color: themeConfig.colors.success,
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

        const chart = createManagedChart(canvas, config);
        if (chart) {
            console.log("[ChartJS] GPS time chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering GPS time chart:", error);
    }
}

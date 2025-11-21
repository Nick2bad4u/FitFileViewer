import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// Event messages chart renderer
/**
 * @param {HTMLElement} container
 * @param {{ showLegend?: boolean, showTitle?: boolean, showGrid?: boolean, zoomPluginConfig?: any }} options
 * @param {Date|number} startTime
 */
export function renderEventMessagesChart(container, options, startTime) {
    try {
        const eventMesgs = globalThis.globalData?.eventMesgs;
        if (!eventMesgs || !Array.isArray(eventMesgs) || eventMesgs.length === 0) {
            return;
        }

        // Get theme configuration and user-preferred event color (if set)
        /** @type {any} */
        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("events", 0)),
            rawColor = /** @type {string|null|undefined} */ (getChartSetting("color_event_messages")),
            eventColor = typeof rawColor === "string" && rawColor.length > 0 ? rawColor : "#9c27b0",
            themeConfig = getThemeConfig(),
            defaultThemeColors = {
                backgroundAlt: "#ffffff",
                chartBackground: "#ffffff",
                chartBorder: "#dee2e6",
                chartSurface: "#f8f9fa",
                gridLines: "#e9ecef",
                shadow: "0 2px 4px #00000020",
                text: "#000000",
                textPrimary: "#000000",
            },
            themeColors = { ...defaultThemeColors };
        if (themeConfig && themeConfig.colors) {
            Object.assign(themeColors, themeConfig.colors);
        }

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = themeColors.shadow || "0 2px 4px #00000020";

        container.append(canvas);
        // Prepare event data with relative timestamps
        const eventData = eventMesgs.map((event) => {
                let timestamp = event.timestamp || event.time || 0;

                // Convert to relative seconds from start time
                if (timestamp && startTime) {
                    let eventTimestamp, startTimestamp;

                    // Handle different timestamp formats
                    if (timestamp instanceof Date) {
                        eventTimestamp = timestamp.getTime() / 1000; // Convert to seconds
                    } else if (typeof timestamp === "number") {
                        // Check if timestamp is in milliseconds or seconds
                        eventTimestamp = timestamp > 1_000_000_000_000 ? timestamp / 1000 : timestamp;
                    } else {
                        return { event: event.event || event.message || event.eventType || "Event", x: 0, y: 1 };
                    }

                    if (startTime instanceof Date) {
                        startTimestamp = startTime.getTime() / 1000; // Convert to seconds
                    } else if (typeof startTime === "number") {
                        // Check if startTime is in milliseconds or seconds
                        startTimestamp = startTime > 1_000_000_000_000 ? startTime / 1000 : startTime;
                    } else {
                        return { event: event.event || event.message || event.eventType || "Event", x: 0, y: 1 };
                    }

                    // Convert to relative seconds
                    timestamp = Math.round(eventTimestamp - startTimestamp);
                }

                return {
                    event: event.event || event.message || event.eventType || "Event",
                    x: timestamp,
                    y: 1, // Events are just markers
                };
            }),
            config = {
                data: {
                    datasets: [
                        {
                            backgroundColor: `${eventColor}CC`, // Add transparency
                            borderColor: eventColor,
                            data: eventData,
                            label: "Events",
                            pointHoverRadius: 8,
                            pointRadius: 6,
                        },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        ...(options.zoomPluginConfig ? { zoom: options.zoomPluginConfig } : {}),
                        chartBackgroundColorPlugin: {
                            backgroundColor: themeColors.chartBackground,
                        },
                        legend: {
                            display: options.showLegend,
                            labels: { color: themeColors.text },
                        },
                        title: {
                            color: themeColors.text,
                            display: options.showTitle,
                            font: { size: 16, weight: "bold" },
                            text: "Event Messages",
                        },
                        tooltip: {
                            backgroundColor: themeColors.chartSurface || defaultThemeColors.chartSurface,
                            bodyColor: themeColors.text || defaultThemeColors.text,
                            borderColor: themeColors.chartBorder || defaultThemeColors.chartBorder,
                            borderWidth: 1,
                            callbacks: {
                                /** @param {any} context */
                                label(context) {
                                    const point = context.raw;
                                    return point.event || "Event";
                                },
                            },
                            titleColor: themeColors.text || defaultThemeColors.text,
                        },
                    },
                    responsive: true,
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color: themeColors.gridLines || defaultThemeColors.gridLines,
                                display: options.showGrid,
                            },
                            ticks: {
                                /** @param {any} value */
                                callback(value) {
                                    return formatTime(value, true);
                                },
                                color: themeColors.text || defaultThemeColors.text,
                            },
                            title: {
                                color: themeColors.text || defaultThemeColors.text,
                                display: true,
                                text: `Time (${getUnitSymbol("time", "time")})`,
                            },
                            type: "linear",
                        },
                        y: {
                            display: false,
                            grid: {
                                color: themeColors.gridLines || defaultThemeColors.gridLines,
                                display: false,
                            },
                            ticks: {
                                /** @param {any} value */
                                callback(value) {
                                    return formatTime(value, true);
                                },
                                color: themeColors.text || defaultThemeColors.text,
                            },
                        },
                    },
                },
                plugins: [chartZoomResetPlugin, "chartBackgroundColorPlugin"],
                type: "scatter",
            };

        const chart = createManagedChart(canvas, config);
        if (chart) {
            updateChartAnimations(chart, "Event Messages");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering event messages chart:", error);
    }
}

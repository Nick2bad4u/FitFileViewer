import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
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

        // Get theme configuration
        /** @type {any} */
        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("events", 0)),
            // Get user-defined color for event messages
            eventColor = localStorage.getItem("chartjs_color_event_messages") || "#9c27b0", // Purple default
            themeConfig = getThemeConfig();

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        if (themeConfig?.colors) {
            canvas.style.boxShadow = themeConfig.colors.shadow || "";
        }

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
                            text: "Event Messages",
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
                                    return point.event || "Event";
                                },
                            },
                            titleColor: themeConfig.colors.textPrimary,
                        },
                        titleColor: themeConfig.colors.text,
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
                                    // Format seconds according to user's preferred units
                                    return formatTime(value, true);
                                },
                                color: themeConfig.colors.textPrimary,
                            },
                            title: {
                                color: themeConfig.colors.textPrimary,
                                display: true,
                                text: `Time (${getUnitSymbol("time", "time")})`,
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
                                    // Format seconds according to user's preferred units
                                    return formatTime(value, true);
                                },
                                color: themeConfig.colors.textPrimary,
                            },
                        },
                    },
                },
                plugins: [chartZoomResetPlugin, "chartBackgroundColorPlugin"],
                type: "scatter",
            },
            chart = new globalThis.Chart(canvas, config);
        if (chart) {
            updateChartAnimations(chart, "Event Messages");
            if (!globalThis._chartjsInstances) {
                globalThis._chartjsInstances = [];
            }
            globalThis._chartjsInstances.push(chart);
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering event messages chart:", error);
    }
}

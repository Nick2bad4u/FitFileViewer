import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// Event messages chart renderer
/**
 * @param {HTMLElement} container
 * @param {{ showLegend?: boolean, showTitle?: boolean, showGrid?: boolean, zoomPluginConfig?: any }} options
 * @param {Date|number} startTime
 */
export function renderEventMessagesChart(container, options, startTime) {
    try {
        const eventMesgs = window.globalData?.eventMesgs;
        if (!eventMesgs || !Array.isArray(eventMesgs) || eventMesgs.length === 0) {
            return;
        }

        // Get theme configuration
        /** @type {any} */
        const themeConfig = getThemeConfig(),

        // Get user-defined color for event messages
         eventColor = localStorage.getItem("chartjs_color_event_messages") || "#9c27b0", // Purple default

         canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("events", 0));

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        if (themeConfig?.colors) {
            canvas.style.boxShadow = themeConfig.colors.shadow || "";
        }

        container.appendChild(canvas);
        // Prepare event data with relative timestamps
        const eventData = eventMesgs.map((event) => {
            let timestamp = event.timestamp || event.time || 0;

            // Convert to relative seconds from start time
            if (timestamp && startTime) {
                let eventTimestamp,
                 startTimestamp;

                // Handle different timestamp formats
                if (timestamp instanceof Date) {
                    eventTimestamp = timestamp.getTime() / 1000; // Convert to seconds
                } else if (typeof timestamp === "number") {
                    // Check if timestamp is in milliseconds or seconds
                    eventTimestamp = timestamp > 1000000000000 ? timestamp / 1000 : timestamp;
                } else {
                    return { x: 0, y: 1, event: event.event || event.message || event.eventType || "Event" };
                }

                if (startTime instanceof Date) {
                    startTimestamp = startTime.getTime() / 1000; // Convert to seconds
                } else if (typeof startTime === "number") {
                    // Check if startTime is in milliseconds or seconds
                    startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
                } else {
                    return { x: 0, y: 1, event: event.event || event.message || event.eventType || "Event" };
                }

                // Convert to relative seconds
                timestamp = Math.round(eventTimestamp - startTimestamp);
            }

            return {
                x: timestamp,
                y: 1, // Events are just markers
                event: event.event || event.message || event.eventType || "Event",
            };
        }),

         config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Events",
                        data: eventData,
                        backgroundColor: `${eventColor  }CC`, // Add transparency
                        borderColor: eventColor,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend,
                        labels: {
                            color: themeConfig.colors.textPrimary,
                        },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Event Messages",
                        font: { size: 16, weight: "bold" },
                        color: themeConfig.colors.textPrimary,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.bgSecondary,
                        titleColor: themeConfig.colors.textPrimary,
                        bodyColor: themeConfig.colors.textPrimary,
                        borderColor: themeConfig.colors.border,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label (context) {
                                const point = context.raw;
                                return point.event || "Event";
                            },
                        },
                    },
                    zoom: options.zoomPluginConfig,
                    chartBackgroundColorPlugin: {
                        backgroundColor: themeConfig.colors.bgPrimary,
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: themeConfig.colors.gridLines,
                        },
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: {
                            color: themeConfig.colors.textPrimary,
                            /** @param {any} value */
                            callback (value) {
                                // Format seconds according to user's preferred units
                                return formatTime(value, true);
                            },
                        },
                    },
                    y: {
                        display: false,
                    },
                },
            },
            plugins: [chartZoomResetPlugin, "chartBackgroundColorPlugin"],
        },

         chart = new window.Chart(canvas, config);
        if (chart) {
            updateChartAnimations(chart, "Event Messages");
            if (!window._chartjsInstances) {window._chartjsInstances = [];}
            window._chartjsInstances.push(chart);
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering event messages chart:", error);
    }
}

import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { getChartEmoji, getChartIcon } from "../../ui/icons/iconMappings.js";
import { attachChartLabelMetadata } from "../components/attachChartLabelMetadata.js";
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
        const globalData = getGlobalData();
        const eventMesgs = Array.isArray(globalData?.eventMesgs) ? globalData.eventMesgs : null;
        if (!eventMesgs || !Array.isArray(eventMesgs) || eventMesgs.length === 0) {
            return;
        }

        // Get theme configuration
        /** @type {any} */
        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("events", 0)),
            eventColor = localStorage.getItem("chartjs_color_event_messages") || "#9c27b0",
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

        const xLabel = `Time (${getUnitSymbol("time", "time")})`,
            titleText = "Event Messages",
            legendEmoji = getChartEmoji("event_messages"),
            datasetLabel = legendEmoji ? `${legendEmoji} Events` : "Events";

        attachChartLabelMetadata(canvas, {
            titleIcon: getChartIcon("event_messages"),
            titleText,
            titleColor: eventColor,
            xIcon: getChartIcon("time"),
            xText: xLabel,
        });

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
                            label: datasetLabel,
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
                            color: "rgba(0,0,0,0)",
                            display: options.showTitle,
                            font: { size: 16, weight: "bold" },
                            text: titleText,
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
                                color: "rgba(0,0,0,0)",
                                display: true,
                                text: xLabel,
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

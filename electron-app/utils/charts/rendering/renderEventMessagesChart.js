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
 * @typedef {Object} EventMessagesChartOptions
 *
 * @property {boolean} [showLegend]
 * @property {boolean} [showTitle]
 * @property {boolean} [showGrid]
 * @property {Record<string, unknown>} [zoomPluginConfig]
 */
/**
 * @typedef {Object} EventMessageRecord
 *
 * @property {unknown} [event]
 * @property {unknown} [eventType]
 * @property {unknown} [message]
 * @property {unknown} [time]
 * @property {unknown} [timestamp]
 */
/**
 * @typedef {Object} EventChartPoint
 *
 * @property {string} event
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef {Object} EventTooltipContext
 *
 * @property {{ event?: unknown }} [raw]
 */
/**
 * @typedef {Object} EventMessagesThemeConfig
 *
 * @property {Record<string, string>} [colors]
 */
/**
 * @typedef {Object} EventMessagesRuntimeGlobal
 *
 * @property {{ eventMesgs?: unknown } | undefined} [globalData]
 */

const chartGlobal = /** @type {EventMessagesRuntimeGlobal} */ (globalThis);

/**
 * @param {EventMessageRecord} event
 *
 * @returns {string}
 */
function getEventLabel(event) {
    for (const value of [event.event, event.message, event.eventType]) {
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
    }
    return "Event";
}

/**
 * @param {unknown} timestamp
 *
 * @returns {number | null}
 */
function getTimestampSeconds(timestamp) {
    if (timestamp instanceof Date) {
        return timestamp.getTime() / 1000;
    }
    if (typeof timestamp === "number") {
        return timestamp > 1_000_000_000_000 ? timestamp / 1000 : timestamp;
    }
    return null;
}

/**
 * @param {unknown} value
 *
 * @returns {number}
 */
function toFiniteNumber(value) {
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

/**
 * @param {HTMLElement} container
 * @param {EventMessagesChartOptions} options
 * @param {Date | number} startTime
 */
export function renderEventMessagesChart(container, options, startTime) {
    try {
        const eventMesgs = chartGlobal.globalData?.eventMesgs;
        if (
            !eventMesgs ||
            !Array.isArray(eventMesgs) ||
            eventMesgs.length === 0
        ) {
            return;
        }

        // Get theme configuration and user-preferred event color (if set)
        const canvas = /** @type {HTMLCanvasElement} */ (
                createChartCanvas("events", 0)
            ),
            rawColor = /** @type {string | null | undefined} */ (
                getChartSetting("color_event_messages")
            ),
            eventColor =
                typeof rawColor === "string" && rawColor.length > 0
                    ? rawColor
                    : "#9c27b0",
            themeConfig = /** @type {EventMessagesThemeConfig} */ (
                getThemeConfig()
            ),
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
        /** @type {EventChartPoint[]} */
        const eventData = eventMesgs.map((event) => {
                const eventRecord = /** @type {EventMessageRecord} */ (event);
                let timestamp = eventRecord.timestamp || eventRecord.time || 0;

                // Convert to relative seconds from start time
                if (timestamp && startTime) {
                    const eventTimestamp = getTimestampSeconds(timestamp),
                        startTimestamp = getTimestampSeconds(startTime);
                    if (
                        eventTimestamp === null ||
                        startTimestamp === null
                    ) {
                        return {
                            event: getEventLabel(eventRecord),
                            x: 0,
                            y: 1,
                        };
                    }

                    // Convert to relative seconds
                    timestamp = Math.round(eventTimestamp - startTimestamp);
                }

                return {
                    event: getEventLabel(eventRecord),
                    x: toFiniteNumber(timestamp),
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
                        ...(options.zoomPluginConfig
                            ? { zoom: options.zoomPluginConfig }
                            : {}),
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
                            backgroundColor:
                                themeColors.chartSurface ||
                                defaultThemeColors.chartSurface,
                            bodyColor:
                                themeColors.text || defaultThemeColors.text,
                            borderColor:
                                themeColors.chartBorder ||
                                defaultThemeColors.chartBorder,
                            borderWidth: 1,
                            callbacks: {
                                /** @param {EventTooltipContext} context */
                                label(context) {
                                    const point = context.raw;
                                    return typeof point?.event === "string" &&
                                        point.event.length > 0
                                        ? point.event
                                        : "Event";
                                },
                            },
                            titleColor:
                                themeColors.text || defaultThemeColors.text,
                        },
                    },
                    responsive: true,
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color:
                                    themeColors.gridLines ||
                                    defaultThemeColors.gridLines,
                                display: options.showGrid,
                            },
                            ticks: {
                                /** @param {number | string} value */
                                callback(value) {
                                    return formatTime(
                                        toFiniteNumber(value),
                                        true
                                    );
                                },
                                color:
                                    themeColors.text || defaultThemeColors.text,
                            },
                            title: {
                                color:
                                    themeColors.text || defaultThemeColors.text,
                                display: true,
                                text: `Time (${getUnitSymbol("time", "time")})`,
                            },
                            type: "linear",
                        },
                        y: {
                            display: false,
                            grid: {
                                color:
                                    themeColors.gridLines ||
                                    defaultThemeColors.gridLines,
                                display: false,
                            },
                            ticks: {
                                /** @param {number | string} value */
                                callback(value) {
                                    return formatTime(
                                        toFiniteNumber(value),
                                        true
                                    );
                                },
                                color:
                                    themeColors.text || defaultThemeColors.text,
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

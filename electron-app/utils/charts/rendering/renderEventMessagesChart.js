import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
const DEFAULT_EVENT_THEME_COLORS = {
    backgroundAlt: "#ffffff",
    chartBackground: "#ffffff",
    chartBorder: "#dee2e6",
    chartSurface: "#f8f9fa",
    gridLines: "#e9ecef",
    shadow: "0 2px 4px #00000020",
    text: "#000000",
    textPrimary: "#000000",
};
function getChartGlobal() {
    return globalThis;
}
function getStringThemeColor(colors, colorKey) {
    const value = colors[colorKey];
    return typeof value === "string" && value
        ? value
        : DEFAULT_EVENT_THEME_COLORS[colorKey];
}
function getEventThemeColors(colors) {
    return {
        backgroundAlt: getStringThemeColor(colors, "backgroundAlt"),
        chartBackground: getStringThemeColor(colors, "chartBackground"),
        chartBorder: getStringThemeColor(colors, "chartBorder"),
        chartSurface: getStringThemeColor(colors, "chartSurface"),
        gridLines: getStringThemeColor(colors, "gridLines"),
        shadow: getStringThemeColor(colors, "shadow"),
        text: getStringThemeColor(colors, "text"),
        textPrimary: getStringThemeColor(colors, "textPrimary"),
    };
}
function asEventRecord(value) {
    return isObjectRecord(value) ? value : {};
}
function getEventLabel(event) {
    for (const value of [
        event.event,
        event.message,
        event.eventType,
    ]) {
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
    }
    return "Event";
}
function getTimestampSeconds(timestamp) {
    if (timestamp instanceof Date) {
        return timestamp.getTime() / 1000;
    }
    if (typeof timestamp === "number") {
        return timestamp > 1_000_000_000_000 ? timestamp / 1000 : timestamp;
    }
    return null;
}
function toFiniteNumber(value) {
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}
function toEventChartPoint(event, startTime) {
    const eventRecord = asEventRecord(event);
    let timestamp = eventRecord.timestamp || eventRecord.time || 0;
    if (timestamp && startTime) {
        const eventTimestamp = getTimestampSeconds(timestamp);
        const startTimestamp = getTimestampSeconds(startTime);
        if (eventTimestamp === null || startTimestamp === null) {
            return {
                event: getEventLabel(eventRecord),
                x: 0,
                y: 1,
            };
        }
        timestamp = Math.round(eventTimestamp - startTimestamp);
    }
    return {
        event: getEventLabel(eventRecord),
        x: toFiniteNumber(timestamp),
        y: 1,
    };
}
/**
 * Renders a scatter chart showing event-message timestamps.
 *
 * @param container - Parent element to append the chart canvas into.
 * @param options - Chart display options.
 * @param startTime - Activity start time used to normalize event timestamps.
 */
export function renderEventMessagesChart(container, options = {}, startTime) {
    try {
        const eventMesgs = getChartGlobal().globalData?.eventMesgs;
        if (!Array.isArray(eventMesgs) || eventMesgs.length === 0) {
            return;
        }
        const canvas = createChartCanvas("events", 0);
        const rawColor = getChartSetting("color_event_messages");
        const eventColor =
            typeof rawColor === "string" && rawColor.length > 0
                ? rawColor
                : "#9c27b0";
        const themeColors = getEventThemeColors(getThemeConfig().colors);
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = themeColors.shadow;
        container.append(canvas);
        const eventData = eventMesgs.map((event) =>
            toEventChartPoint(event, startTime)
        );
        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${eventColor}CC`,
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
                        backgroundColor: themeColors.chartSurface,
                        bodyColor: themeColors.text,
                        borderColor: themeColors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            label(context) {
                                const point = context.raw;
                                return typeof point?.event === "string" &&
                                    point.event.length > 0
                                    ? point.event
                                    : "Event";
                            },
                        },
                        titleColor: themeColors.text,
                    },
                },
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: themeColors.gridLines,
                            display: options.showGrid,
                        },
                        ticks: {
                            callback(value) {
                                return formatTime(toFiniteNumber(value), true);
                            },
                            color: themeColors.text,
                        },
                        title: {
                            color: themeColors.text,
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                        },
                        type: "linear",
                    },
                    y: {
                        display: false,
                        grid: {
                            color: themeColors.gridLines,
                            display: false,
                        },
                        ticks: {
                            callback(value) {
                                return formatTime(toFiniteNumber(value), true);
                            },
                            color: themeColors.text,
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

import { chartBackgroundColorPlugin } from "../../charts/plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../../charts/plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getUnitSymbol } from "../lookups/getUnitSymbol.js";
import { getChartZoneColors } from "./chartZoneColorUtils.js";
function toFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function toDisplayValue(value) {
    return toFiniteNumber(value);
}
function normalizeZoneData(zoneData) {
    return zoneData
        .filter((zone) => zone !== null && typeof zone === "object")
        .map((zone) => ({
        color: typeof zone["color"] === "string" ? zone["color"] : undefined,
        label: typeof zone["label"] === "string"
            ? zone["label"]
            : String(zone["label"]),
        value: toFiniteNumber(zone["value"]),
    }));
}
/**
 * Renders a single heart rate zone bar (e.g., for a summary or lap).
 *
 * @throws When Chart.js, the target canvas, or zone data is unavailable.
 */
export function renderSingleHRZoneBar(canvas, zoneData, options = {}) {
    const chartGlobal = globalThis;
    try {
        if (!chartGlobal.Chart || !canvas || !Array.isArray(zoneData)) {
            throw new Error("Chart.js, canvas, or zoneData missing");
        }
        const normalizedZoneData = normalizeZoneData(zoneData);
        if (normalizedZoneData.length === 0) {
            return null;
        }
        if (!canvas.classList.contains("chart-canvas")) {
            canvas.classList.add("chart-canvas");
        }
        const theme = detectCurrentTheme();
        console.log("[renderSingleHRZoneBar] Detected theme:", theme);
        const savedColors = getChartZoneColors("hr", normalizedZoneData.length);
        const datasets = normalizedZoneData.map((zone, index) => ({
            backgroundColor: zone.color ??
                savedColors[index] ??
                (theme === "dark" ? "#ef4444" : "#dc2626"),
            borderColor: theme === "dark" ? "#333" : "#fff",
            borderWidth: 1,
            data: [zone.value],
            label: zone.label,
        }));
        const chartConfig = {
            data: {
                datasets,
                labels: ["Time in Zone"],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: true,
                        font: {
                            size: 12,
                            weight: "bold",
                        },
                        text: "chart background plugin",
                    },
                    legend: {
                        backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: true,
                        font: {
                            size: 12,
                        },
                        labels: {
                            color: theme === "dark" ? "#fff" : "#000",
                            font: {
                                size: 12,
                            },
                        },
                        text: "zone legend",
                        title: "",
                    },
                    title: {
                        backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: Boolean(options.title),
                        font: {
                            size: 16,
                            weight: "bold",
                        },
                        text: options.title || "Heart Rate Zones",
                    },
                    tooltip: {
                        backgroundColor: theme === "dark" ? "#222" : "#fff",
                        bodyColor: theme === "dark" ? "#fff" : "#000",
                        borderColor: theme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            label(context) {
                                const timeFormatted = formatTime(toDisplayValue(context.parsed.y), true);
                                return `${context.dataset.label}: ${timeFormatted}`;
                            },
                        },
                        titleColor: theme === "dark" ? "#fff" : "#000",
                    },
                    zoom: {
                        limits: {
                            y: {
                                max: "original",
                                min: 0,
                            },
                        },
                        pan: {
                            enabled: true,
                            mode: "xy",
                            modifierKey: null,
                        },
                        zoom: {
                            drag: {
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgba(59, 130, 246, 0.8)",
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
                        grid: {
                            color: theme === "dark"
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        title: {
                            color: theme === "dark" ? "#fff" : "#000",
                            display: false,
                            text: "Zone",
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: theme === "dark"
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                        },
                        ticks: {
                            callback(value) {
                                return formatTime(toDisplayValue(value), true);
                            },
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        title: {
                            color: theme === "dark" ? "#fff" : "#000",
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                        },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: "bar",
        };
        return new chartGlobal.Chart(canvas, chartConfig);
    }
    catch (error) {
        if (chartGlobal.showNotification) {
            chartGlobal.showNotification("Failed to render HR zone bar", "error");
        }
        console.error("[renderSingleHRZoneBar] Error:", error);
        return null;
    }
}

import { chartBackgroundColorPlugin } from "../../charts/plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../../charts/plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getUnitSymbol } from "../lookups/getUnitSymbol.js";
import { getChartZoneColors } from "./chartZoneColorUtils.js";

/**
 * Renders a single heart rate zone bar (e.g., for a summary or lap)
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object[]} zoneData - Array of zone objects {label, value, color}
 * @param {Object} [options={}] - Chart options (theme, title, etc.)
 * @returns {*|null} Chart.js instance or null on error
 */

export function renderSingleHRZoneBar(canvas, zoneData, options = {}) {
    try {
        if (!(/** @type {any} */ (globalThis).Chart) || !canvas || !Array.isArray(zoneData)) {
            throw new Error("Chart.js, canvas, or zoneData missing");
        }
        const theme = detectCurrentTheme();
        console.log("[renderSingleHRZoneBar] Detected theme:", theme);

        // Get saved HR zone colors
        const savedColors = getChartZoneColors("hr", zoneData.length);

        // Create one dataset per zone for interactive legend
        const datasets = zoneData.map((zone, index) => ({
                backgroundColor:
                    /** @type {any} */ (zone).color || savedColors[index] || (theme === "dark" ? "#ef4444" : "#dc2626"),
                borderColor: theme === "dark" ? "#333" : "#fff",
                borderWidth: 1,
                data: [/** @type {any} */ (zone).value], // Single value array for this zone
                label: /** @type {any} */ (zone).label,
            })),
            chart = new /** @type {any} */ (globalThis).Chart(canvas, {
                data: {
                    datasets,
                    labels: ["Time in Zone"], // Single category for all zones
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        chartBackgroundColorPlugin: {
                            backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                        },
                        legend: {
                            display: true,
                            labels: {
                                color: theme === "dark" ? "#fff" : "#000",
                                font: { size: 12 },
                            },
                            position: "top",
                        },
                        title: {
                            color: theme === "dark" ? "#fff" : "#000",
                            display: Boolean(options.title),
                            font: { size: 16, weight: "bold" },
                            text: /** @type {any} */ (options).title || "Heart Rate Zones",
                        },
                        tooltip: {
                            backgroundColor: theme === "dark" ? "#222" : "#fff",
                            bodyColor: theme === "dark" ? "#fff" : "#000",
                            borderColor: theme === "dark" ? "#555" : "#ddd",
                            borderWidth: 1,
                            callbacks: {
                                /** @param {any} context */
                                label(context) {
                                    const timeFormatted = formatTime(context.parsed.y, true);
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
                                color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            },
                            ticks: {
                                color: theme === "dark" ? "#fff" : "#000",
                            },
                            title: {
                                color: theme === "dark" ? "#fff" : "#000",
                                display: false, // Hide x-axis title since we only have one category
                                text: "Zone",
                            },
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            },
                            ticks: {
                                /** @param {any} value */
                                callback(value) {
                                    return formatTime(value, true);
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
            });
        return chart;
    } catch (error) {
        if (/** @type {any} */ (globalThis).showNotification) {
            /** @type {any} */ globalThis.showNotification("Failed to render HR zone bar", "error");
        }
        console.error("[renderSingleHRZoneBar] Error:", error);
        return null;
    }
}

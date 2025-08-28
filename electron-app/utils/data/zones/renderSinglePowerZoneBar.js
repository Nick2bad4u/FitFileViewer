import { detectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { getChartZoneColors } from "./chartZoneColorUtils.js";
import { getUnitSymbol } from "../lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { chartZoomResetPlugin } from "../../charts/plugins/chartZoomResetPlugin.js";
import { chartBackgroundColorPlugin } from "../../charts/plugins/chartBackgroundColorPlugin.js";

/**
 * Renders a single power zone bar (e.g., for a summary or lap)
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Array<{label: string, value: number, color?: string}>} zoneData - Array of zone objects {label, value, color}
 * @param {{title?: string}} [options={}] - Chart options (theme, title, etc.)
 * @returns {*|null} Chart.js instance or null on error
 */

export function renderSinglePowerZoneBar(canvas, zoneData, options = {}) {
    try {
        if (!(/** @type {any} */ (window).Chart) || !canvas || !Array.isArray(zoneData)) {
            throw new Error("Chart.js, canvas, or zoneData missing");
        }
        const theme = detectCurrentTheme();
        console.log("[renderSinglePowerZoneBar] Detected theme:", theme);

        // Get saved Power zone colors
        const savedColors = getChartZoneColors("power", zoneData.length);

        // Create one dataset per zone for interactive legend
        const datasets = zoneData.map((zone, index) => ({
            label: zone.label,
            data: [zone.value], // Single value array for this zone
            backgroundColor: zone.color || savedColors[index] || (theme === "dark" ? "#f59e42" : "#fbbf24"),
            borderColor: theme === "dark" ? "#333" : "#fff",
            borderWidth: 1,
        }));

        const chart = new /** @type {any} */ (window).Chart(canvas, {
            type: "bar",
            data: {
                labels: ["Time in Zone"], // Single category for all zones
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            color: theme === "dark" ? "#fff" : "#000",
                            font: { size: 12 },
                        },
                    },
                    title: {
                        display: !!options.title,
                        text: options.title || "Power Zones",
                        color: theme === "dark" ? "#fff" : "#000",
                        font: { size: 16, weight: "bold" },
                    },
                    tooltip: {
                        backgroundColor: theme === "dark" ? "#222" : "#fff",
                        titleColor: theme === "dark" ? "#fff" : "#000",
                        bodyColor: theme === "dark" ? "#fff" : "#000",
                        borderColor: theme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            label: function (/** @type {any} */ context) {
                                const timeFormatted = formatTime(context.parsed.y, true);
                                return `${context.dataset.label}: ${timeFormatted}`;
                            },
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "y",
                            modifierKey: null,
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.1,
                            },
                            pinch: {
                                enabled: true,
                            },
                            drag: {
                                enabled: true,
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgba(59, 130, 246, 0.8)",
                                borderWidth: 2,
                                modifierKey: "shift",
                            },
                            mode: "y",
                        },
                        limits: {
                            y: {
                                min: 0,
                                max: "original",
                            },
                        },
                    },
                    chartBackgroundColorPlugin: {
                        backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: false, // Hide x-axis title since we only have one category
                            text: "Zone",
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        grid: {
                            color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
                            callback: function (/** @type {any} */ value) {
                                return formatTime(value, true);
                            },
                        },
                        grid: {
                            color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        });
        return chart;
    } catch (error) {
        if (/** @type {any} */ (window).showNotification)
            /** @type {any} */ (window).showNotification("Failed to render power zone bar", "error");
        console.error("[renderSinglePowerZoneBar] Error:", error);
        return null;
    }
}

import { getThemeConfig } from "../../theming/core/theme.js";
import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

/**
 * @typedef {Object} LapZoneDatum
 * @property {string} label - Zone label (e.g., "HR Zone 1")
 * @property {number} value - Time in zone (seconds)
 * @property {string} [color] - Base color for the zone
 * @property {number} [zoneIndex] - Numeric zone index (0-based)
 */

/**
 * @typedef {Object} LapZoneEntry
 * @property {string} lapLabel - Label for the lap (e.g., "Lap 1")
 * @property {LapZoneDatum[]} zones - Zone distribution for the lap
 */

/**
 * @typedef {Object} LapZoneChartOptions
 * @property {string} [title]
 */

/**
 * Safely extract zone numeric index from a label like "HR Zone 2".
 * @param {string} label
 * @param {number} fallback
 * @returns {number}
 */
function parseZoneNumber(label, fallback) {
    if (typeof label !== "string") return fallback;
    const match = label.match(/\d+/);
    if (!match) return fallback;
    const num = parseInt(match[0], 10);
    return Number.isFinite(num) ? num : fallback;
}

// Helper function to render lap-by-lap zone analysis bar chart
/**
 * Render lap-by-lap stacked zone chart (HR or Power) with robust guards & typing.
 * @param {HTMLCanvasElement} canvas
 * @param {LapZoneEntry[]} lapZoneData
 * @param {LapZoneChartOptions} [options]
 * @returns {any|null}
 */
export function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }
        const themeConfig = /** @type {any} */ (getThemeConfig() || {});
        if (themeConfig && typeof themeConfig === "object" && "name" in themeConfig) {
            console.log("[renderLapZoneChart] Using theme config:", themeConfig.name);
        }

        // Get unique zone labels from all laps (since we now filter zones)
        const allZoneLabels = new Set();
        const allZoneData = new Map(); // zone label -> zone info

        lapZoneData.forEach((lap) => {
            lap.zones.forEach((zone) => {
                allZoneLabels.add(zone.label);
                if (!allZoneData.has(zone.label)) {
                    allZoneData.set(zone.label, zone);
                }
            });
        });

        const zoneLabels = Array.from(allZoneLabels).sort((a, b) => {
            const aNum = parseZoneNumber(a, 0);
            const bNum = parseZoneNumber(b, 0);
            return aNum - bNum;
        });

        const numZones = zoneLabels.length;

        // Create one dataset per zone (stacked across laps)
        /** @type {any[]} */
        const datasets = [];
        for (let zoneIndex = 0; zoneIndex < numZones; zoneIndex++) {
            const zoneLabel = zoneLabels[zoneIndex];
            /** @type {LapZoneDatum|undefined} */
            const zoneInfo = allZoneData.get(zoneLabel);

            // Determine zone type (infer from title)
            let zoneType = "hr";
            if (options.title && typeof options.title === "string" && options.title.toLowerCase().includes("power")) {
                zoneType = "power";
            }

            const zoneIdx = typeof zoneInfo?.zoneIndex === "number" ? zoneInfo.zoneIndex : zoneIndex;
            const savedColor = getZoneColor(zoneType, zoneIdx);
            const originalColor = zoneInfo?.color;
            const zoneColor = savedColor || originalColor || `hsl(${zoneIndex * 45}, 70%, 60%)`;

            const data = lapZoneData.map((lap) => {
                const zone = Array.isArray(lap.zones) ? lap.zones.find((z) => z.label === zoneLabel) : undefined;
                return zone ? zone.value : 0;
            });

            datasets.push({
                label: zoneLabel,
                data,
                backgroundColor: zoneColor,
                borderColor: themeConfig?.colors?.textSecondary || "#444",
                borderWidth: 1,
                stack: "zones",
            });
        }

        // Labels are lap names
        const lapLabels = lapZoneData.map((lap) => (lap && typeof lap.lapLabel === "string" ? lap.lapLabel : "Lap"));

        /** @type {any} */
        const chart = new window.Chart(canvas, {
            type: "bar",
            data: {
                labels: lapLabels,
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
                            color: themeConfig?.colors?.textPrimary || "#000",
                            font: { size: 12 },
                        },
                    },
                    title: {
                        display: !!options.title,
                        text: options.title || "Zone Distribution by Lap",
                        color: themeConfig?.colors?.textPrimary || "#000",
                        font: { size: 16, weight: "bold" },
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        backgroundColor: themeConfig?.colors?.chartSurface || "rgba(0,0,0,0.8)",
                        titleColor: themeConfig?.colors?.textPrimary || "#fff",
                        bodyColor: themeConfig?.colors?.textPrimary || "#fff",
                        borderColor: themeConfig?.colors?.chartBorder || "#333",
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label: function (context) {
                                let lapTotal = 0;
                                const datasetsArr = context.chart?.data?.datasets || [];
                                datasetsArr.forEach((/** @type {any} */ dataset) => {
                                    const dsData = /** @type {number[]} */ (dataset.data || []);
                                    const v = dsData[context.dataIndex];
                                    if (typeof v === "number") lapTotal += v;
                                });
                                const value = context.parsed?.y || 0;
                                const timeFormatted = formatTime(value, true);
                                const percentage = lapTotal > 0 ? ((value / lapTotal) * 100).toFixed(1) : "0.0";
                                return `${context.dataset?.label || "Zone"}: ${timeFormatted} (${percentage}%)`;
                            },
                            /** @param {any[]} tooltipItems */
                            footer: function (tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach((item) => {
                                    total += item.parsed?.y || 0;
                                });
                                const totalFormatted = formatTime(total, true);
                                return `Total: ${totalFormatted}`;
                            },
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "xy",
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
                                backgroundColor: themeConfig?.colors?.primaryAlpha || "rgba(59,130,246,0.2)",
                                borderColor: themeConfig?.colors?.primary || "rgba(59,130,246,0.8)",
                                borderWidth: 2,
                                modifierKey: "shift",
                            },
                            mode: "xy",
                        },
                        limits: {
                            x: {
                                min: "original",
                                max: "original",
                            },
                        },
                    },
                    chartBackgroundColorPlugin: {
                        backgroundColor: themeConfig?.colors?.chartBackground || "#fff",
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Lap",
                            color: themeConfig?.colors?.textPrimary || "#000",
                        },
                        ticks: {
                            color: themeConfig?.colors?.textPrimary || "#000",
                        },
                        grid: {
                            color: themeConfig?.colors?.chartGrid || "rgba(0,0,0,0.1)",
                        },
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: themeConfig?.colors?.textPrimary || "#000",
                        },
                        ticks: {
                            color: themeConfig?.colors?.textPrimary || "#000",
                            /** @param {number|string} value */
                            callback: function (value) {
                                const num = typeof value === "number" ? value : Number(value);
                                return formatTime(Number.isFinite(num) ? num : 0, true);
                            },
                        },
                        grid: {
                            color: themeConfig?.colors?.chartGrid || "rgba(0,0,0,0.1)",
                        },
                    },
                },
                interaction: {
                    mode: "index",
                    intersect: false,
                },
            },
            plugins: [
                chartZoomResetPlugin,
                {
                    id: "chartBackgroundColorPlugin",
                    backgroundColor: themeConfig?.colors?.chartBackground || "#fff",
                },
            ],
        });
        return chart;
    } catch (error) {
        if (window.showNotification) window.showNotification("Failed to render lap zone chart", "error");
        console.error("[renderLapZoneChart] Error:", error);
        return null;
    }
}

import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

/**
 * @typedef {Object} LapZoneDatum
 *
 * @property {string} label - Zone label (e.g., "HR Zone 1")
 * @property {number} value - Time in zone (seconds)
 * @property {string} [color] - Base color for the zone
 * @property {number} [zoneIndex] - Numeric zone index (0-based)
 */

/**
 * @typedef {Object} LapZoneEntry
 *
 * @property {string} lapLabel - Label for the lap (e.g., "Lap 1")
 * @property {LapZoneDatum[]} zones - Zone distribution for the lap
 */

/**
 * @typedef {Object} LapZoneChartOptions
 *
 * @property {string} [title]
 */

// Helper function to render lap-by-lap zone analysis bar chart
/**
 * Render lap-by-lap stacked zone chart (HR or Power) with robust guards &
 * typing.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {LapZoneEntry[]} lapZoneData
 * @param {LapZoneChartOptions} [options]
 *
 * @returns {any | null}
 */
export function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!globalThis.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }
        if (!canvas.classList.contains("chart-canvas")) {
            canvas.classList.add("chart-canvas");
        }
        const themeConfig = /** @type {any} */ (getThemeConfig() || {});
        if (
            themeConfig &&
            typeof themeConfig === "object" &&
            "name" in themeConfig
        ) {
            console.log(
                "[renderLapZoneChart] Using theme config:",
                themeConfig.name
            );
        }

        // Get unique zone labels from all laps (since we now filter zones)
        const allZoneData = new Map(), // Zone label -> zone info
            allZoneLabels = new Set();

        for (const lap of lapZoneData) {
            for (const zone of lap.zones) {
                allZoneLabels.add(zone.label);
                if (!allZoneData.has(zone.label)) {
                    allZoneData.set(zone.label, zone);
                }
            }
        }

        const // Create one dataset per zone (stacked across laps)
            /** @type {any[]} */
            datasets = [],
            zoneLabels = [...allZoneLabels].sort((a, b) => {
                const aNum = parseZoneNumber(a, 0),
                    bNum = parseZoneNumber(b, 0);
                return aNum - bNum;
            }),
            numZones = zoneLabels.length;
        for (let zoneIndex = 0; zoneIndex < numZones; zoneIndex++) {
            const zoneLabel = zoneLabels[zoneIndex],
                /** @type {LapZoneDatum | undefined} */
                zoneInfo = allZoneData.get(zoneLabel);

            // Determine zone type (infer from title)
            let zoneType = "hr";
            if (
                options.title &&
                typeof options.title === "string" &&
                options.title.toLowerCase().includes("power")
            ) {
                zoneType = "power";
            }

            const data = lapZoneData.map((lap) => {
                    const zone = Array.isArray(lap.zones)
                        ? lap.zones.find((z) => z.label === zoneLabel)
                        : undefined;
                    return zone ? zone.value : 0;
                }),
                originalColor = zoneInfo?.color,
                zoneIdx =
                    typeof zoneInfo?.zoneIndex === "number"
                        ? zoneInfo.zoneIndex
                        : zoneIndex,
                savedColor = getZoneColor(zoneType, zoneIdx),
                zoneColor =
                    savedColor ||
                    originalColor ||
                    `hsl(${zoneIndex * 45}, 70%, 60%)`;

            datasets.push({
                backgroundColor: zoneColor,
                borderColor: themeConfig?.colors?.textSecondary || "#444",
                borderWidth: 1,
                data,
                label: zoneLabel,
                stack: "zones",
            });
        }

        // Labels are lap names
        const lapLabels = lapZoneData.map((lap) =>
                lap && typeof lap.lapLabel === "string" ? lap.lapLabel : "Lap"
            ),
            /** @type {any} */
            config = {
                data: {
                    datasets,
                    labels: lapLabels,
                },
                options: {
                    interaction: {
                        intersect: false,
                        mode: "index",
                    },
                    maintainAspectRatio: false,
                    plugins: {
                        chartBackgroundColorPlugin: {
                            backgroundColor:
                                themeConfig?.colors?.chartBackground || "#fff",
                        },
                        legend: {
                            display: true,
                            labels: {
                                color:
                                    themeConfig?.colors?.textPrimary || "#000",
                                font: { size: 12 },
                            },
                            position: "top",
                        },
                        title: {
                            color: themeConfig?.colors?.textPrimary || "#000",
                            display: Boolean(options.title),
                            font: { size: 16, weight: "bold" },
                            text: options.title || "Zone Distribution by Lap",
                        },
                        tooltip: {
                            backgroundColor:
                                themeConfig?.colors?.chartSurface ||
                                "rgba(0,0,0,0.8)",
                            bodyColor:
                                themeConfig?.colors?.textPrimary || "#fff",
                            borderColor:
                                themeConfig?.colors?.chartBorder || "#333",
                            borderWidth: 1,
                            callbacks: {
                                /** @param {any[]} tooltipItems */
                                footer(tooltipItems) {
                                    let total = 0;
                                    for (const item of tooltipItems) {
                                        total += item.parsed?.y || 0;
                                    }
                                    const totalFormatted = formatTime(
                                        total,
                                        true
                                    );
                                    return `Total: ${totalFormatted}`;
                                },
                                /** @param {any} context */
                                label(context) {
                                    let lapTotal = 0;
                                    const datasetsArr =
                                        context.chart?.data?.datasets || [];
                                    for (const dataset of datasetsArr) {
                                        const dsData = /** @type {number[]} */ (
                                                dataset.data || []
                                            ),
                                            v = dsData[context.dataIndex];
                                        if (typeof v === "number") {
                                            lapTotal += v;
                                        }
                                    }
                                    const value = context.parsed?.y || 0,
                                        percentage =
                                            lapTotal > 0
                                                ? (
                                                      (value / lapTotal) *
                                                      100
                                                  ).toFixed(1)
                                                : "0.0",
                                        timeFormatted = formatTime(value, true);
                                    return `${context.dataset?.label || "Zone"}: ${timeFormatted} (${percentage}%)`;
                                },
                            },
                            intersect: false,
                            mode: "index",
                            titleColor:
                                themeConfig?.colors?.textPrimary || "#fff",
                        },
                        zoom: {
                            limits: {
                                x: {
                                    max: "original",
                                    min: "original",
                                },
                                // Prevent panning/zooming into negative time values.
                                // Original min is 0 (beginAtZero + all-positive stacked bars).
                                y: {
                                    max: "original",
                                    min: "original",
                                },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                modifierKey: null,
                            },
                            zoom: {
                                drag: {
                                    backgroundColor:
                                        themeConfig?.colors?.primaryAlpha ||
                                        "rgba(59,130,246,0.2)",
                                    borderColor:
                                        themeConfig?.colors?.primary ||
                                        "rgba(59,130,246,0.8)",
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
                                color:
                                    themeConfig?.colors?.chartGrid ||
                                    "rgba(0,0,0,0.1)",
                            },
                            ticks: {
                                color:
                                    themeConfig?.colors?.textPrimary || "#000",
                            },
                            title: {
                                color:
                                    themeConfig?.colors?.textPrimary || "#000",
                                display: true,
                                text: "Lap",
                            },
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color:
                                    themeConfig?.colors?.chartGrid ||
                                    "rgba(0,0,0,0.1)",
                            },
                            stacked: true,
                            ticks: {
                                /** @param {number | string} value */
                                callback(value) {
                                    const num =
                                        typeof value === "number"
                                            ? value
                                            : Number(value);
                                    if (!Number.isFinite(num)) {
                                        return formatTime(0, true);
                                    }

                                    // Chart.js zoom/pan can generate negative ticks when panned below 0.
                                    // Clamp so we don't spam warnings and don't show nonsense labels.
                                    return formatTime(Math.max(num, 0), true);
                                },
                                color:
                                    themeConfig?.colors?.textPrimary || "#000",
                            },
                            title: {
                                color:
                                    themeConfig?.colors?.textPrimary || "#000",
                                display: true,
                                text: `Time (${getUnitSymbol("time", "time")})`,
                            },
                        },
                    },
                },
                plugins: [
                    chartZoomResetPlugin,
                    {
                        backgroundColor:
                            themeConfig?.colors?.chartBackground || "#fff",
                        id: "chartBackgroundColorPlugin",
                    },
                ],
                type: "bar",
            };

        const chart = createManagedChart(canvas, config);
        return chart;
    } catch (error) {
        if (globalThis.showNotification) {
            globalThis.showNotification(
                "Failed to render lap zone chart",
                "error"
            );
        }
        console.error("[renderLapZoneChart] Error:", error);
        return null;
    }
}

/**
 * Safely extract zone numeric index from a label like "HR Zone 2".
 *
 * @param {string} label
 * @param {number} fallback
 *
 * @returns {number}
 */
function parseZoneNumber(label, fallback) {
    if (typeof label !== "string") {
        return fallback;
    }
    const match = label.match(/\d+/);
    if (!match) {
        return fallback;
    }
    const num = Number.parseInt(match[0], 10);
    return Number.isFinite(num) ? num : fallback;
}

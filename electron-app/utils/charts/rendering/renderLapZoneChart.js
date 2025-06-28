import { getThemeConfig } from "../../theming/core/theme.js";
import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// Helper function to render lap-by-lap zone analysis bar chart
export function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }
        const themeConfig = getThemeConfig();
        console.log("[renderLapZoneChart] Using theme config:", themeConfig.name);

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
            // Sort by zone number (extract number from "Zone X" format)
            const aNum = parseInt(a.match(/\d+/)[0]);
            const bNum = parseInt(b.match(/\d+/)[0]);
            return aNum - bNum;
        });

        const numZones = zoneLabels.length;

        // Create one dataset per zone (stacked across laps)
        const datasets = [];
        for (let zoneIndex = 0; zoneIndex < numZones; zoneIndex++) {
            const zoneLabel = zoneLabels[zoneIndex];
            const zoneInfo = allZoneData.get(zoneLabel);

            // Determine zone type from options or guess from context
            let zoneType = "hr"; // default
            if (options.title && options.title.toLowerCase().includes("power")) {
                zoneType = "power";
            }

            // Get saved color or use the original color if available
            const savedColor = getZoneColor(zoneType, zoneInfo?.zoneIndex || zoneIndex);
            const originalColor = zoneInfo?.color;
            const zoneColor = savedColor || originalColor || `hsl(${zoneIndex * 45}, 70%, 60%)`;

            datasets.push({
                label: zoneLabel,
                data: lapZoneData.map((lap) => {
                    const zone = lap.zones?.find((z) => z.label === zoneLabel);
                    return zone ? zone.value : 0;
                }),
                backgroundColor: zoneColor,
                borderColor: themeConfig.colors.textSecondary,
                borderWidth: 1,
                stack: "zones",
            });
        }

        // Labels are lap names
        const lapLabels = lapZoneData.map((lap) => lap.lapLabel || "Lap");

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
                            color: themeConfig.colors.textPrimary,
                            font: { size: 12 },
                        },
                    },
                    title: {
                        display: !!options.title,
                        text: options.title || "Zone Distribution by Lap",
                        color: themeConfig.colors.textPrimary,
                        font: { size: 16, weight: "bold" },
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        backgroundColor: themeConfig.colors.chartSurface,
                        titleColor: themeConfig.colors.textPrimary,
                        bodyColor: themeConfig.colors.textPrimary,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                // Calculate total time for this lap (sum of all zones)
                                let lapTotal = 0;
                                context.chart.data.datasets.forEach((dataset) => {
                                    lapTotal += dataset.data[context.dataIndex] || 0;
                                });

                                const value = context.parsed.y;
                                const timeFormatted = formatTime(value, true);
                                const percentage = lapTotal > 0 ? ((value / lapTotal) * 100).toFixed(1) : "0.0";

                                return `${context.dataset.label}: ${timeFormatted} (${percentage}%)`;
                            },
                            footer: function (tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach((item) => (total += item.parsed.y));
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
                                backgroundColor: themeConfig.colors.primaryAlpha,
                                borderColor: themeConfig.colors.primary,
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
                        backgroundColor: themeConfig.colors.chartBackground,
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Lap",
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: {
                            color: themeConfig.colors.textPrimary,
                        },
                        grid: {
                            color: themeConfig.colors.chartGrid,
                        },
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: {
                            color: themeConfig.colors.textPrimary,
                            callback: function (value) {
                                return formatTime(value, true);
                            },
                        },
                        grid: {
                            color: themeConfig.colors.chartGrid,
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
                    backgroundColor: themeConfig.colors.chartBackground,
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

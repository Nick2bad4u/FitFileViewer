import { detectCurrentTheme } from "./chartThemeUtils.js";
import { getZoneColor } from "./zoneColorUtils.js";
import { getUnitSymbol } from "./getUnitSymbol.js";
import { formatTime } from "./formatTime.js";
import { zoomResetPlugin } from "./zoomResetPlugin.js";

// Helper function to render lap-by-lap zone analysis bar chart
export function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }
        const theme = detectCurrentTheme();
        console.log("[renderLapZoneChart] Detected theme:", theme);

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
                borderColor: theme === "dark" ? "#333" : "#fff",
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
                            color: theme === "dark" ? "#fff" : "#000",
                            font: { size: 12 },
                        },
                    },
                    title: {
                        display: !!options.title,
                        text: options.title || "Zone Distribution by Lap",
                        color: theme === "dark" ? "#fff" : "#000",
                        font: { size: 16, weight: "bold" },
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        backgroundColor: theme === "dark" ? "#222" : "#fff",
                        titleColor: theme === "dark" ? "#fff" : "#000",
                        bodyColor: theme === "dark" ? "#fff" : "#000",
                        borderColor: theme === "dark" ? "#555" : "#ddd",
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
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgba(59, 130, 246, 0.8)",
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
                    backgroundColorPlugin: {
                        backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Lap",
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
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
                            callback: function (value) {
                                return formatTime(value, true);
                            },
                        },
                        grid: {
                            color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                    },
                },
                interaction: {
                    mode: "index",
                    intersect: false,
                },
            },
            plugins: [
                zoomResetPlugin,
                {
                    id: "backgroundColorPlugin",
                    backgroundColor: theme === "dark" ? "#181c24" : "#ffffff",
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

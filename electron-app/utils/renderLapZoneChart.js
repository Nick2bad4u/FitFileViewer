import { detectCurrentTheme } from "./chartThemeUtils.js";

// Helper function to render lap-by-lap zone analysis bar chart
export function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }
        const theme = detectCurrentTheme();
        console.log("[renderLapZoneChart] Detected theme:", theme);

        // Get unique zone labels from the first lap that has zones
        const firstLapWithZones = lapZoneData.find((lap) => lap.zones && lap.zones.length > 0);
        if (!firstLapWithZones) {
            throw new Error("No lap data with zones found");
        }
        const zoneLabels = firstLapWithZones.zones.map((z) => z.label);
        const numZones = zoneLabels.length;

        // Create one dataset per zone (stacked across laps)
        const datasets = [];
        for (let zoneIndex = 0; zoneIndex < numZones; zoneIndex++) {
            const zoneLabel = zoneLabels[zoneIndex];
            const zoneColor = firstLapWithZones.zones[zoneIndex]?.color || `hsl(${zoneIndex * 45}, 70%, 60%)`;

            datasets.push({
                label: zoneLabel,
                data: lapZoneData.map((lap) => {
                    const zone = lap.zones?.[zoneIndex];
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
                            footer: function (tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach((item) => (total += item.parsed.y));
                                return `Total: ${total.toFixed(1)}s`;
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
                            text: "Time (minutes)",
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
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

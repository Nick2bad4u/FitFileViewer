import { detectCurrentTheme } from "./chartThemeUtils.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { formatTime } from "./formatTime.js";
import { updateChartAnimations } from "./updateChartAnimations.js";

// Event messages chart renderer
export function renderEventMessagesChart(container, options, startTime) {
    try {
        const eventMesgs = window.globalData?.eventMesgs;
        if (!eventMesgs || !Array.isArray(eventMesgs) || eventMesgs.length === 0) {
            return;
        }

        // Get theme using robust detection
        const currentTheme = detectCurrentTheme();
        const canvas = createChartCanvas("events", "events");

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

        container.appendChild(canvas);
        // Prepare event data with relative timestamps
        const eventData = eventMesgs.map((event) => {
            let timestamp = event.timestamp || event.time || 0;

            // Convert to relative seconds from start time
            if (timestamp && startTime) {
                let eventTimestamp;
                let startTimestamp;

                // Handle different timestamp formats
                if (timestamp instanceof Date) {
                    eventTimestamp = timestamp.getTime() / 1000; // Convert to seconds
                } else if (typeof timestamp === "number") {
                    // Check if timestamp is in milliseconds or seconds
                    eventTimestamp = timestamp > 1000000000000 ? timestamp / 1000 : timestamp;
                } else {
                    return { x: 0, y: 1, event: event.event || event.message || event.eventType || "Event" };
                }

                if (startTime instanceof Date) {
                    startTimestamp = startTime.getTime() / 1000; // Convert to seconds
                } else if (typeof startTime === "number") {
                    // Check if startTime is in milliseconds or seconds
                    startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
                } else {
                    return { x: 0, y: 1, event: event.event || event.message || event.eventType || "Event" };
                }

                // Convert to relative seconds
                timestamp = Math.round(eventTimestamp - startTimestamp);
            }

            return {
                x: timestamp,
                y: 1, // Events are just markers
                event: event.event || event.message || event.eventType || "Event",
            };
        });

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Events",
                        data: eventData,
                        backgroundColor: "rgba(255, 99, 132, 0.8)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend,
                        labels: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Event Messages",
                        font: { size: 16, weight: "bold" },
                        color: currentTheme === "dark" ? "#fff" : "#000",
                    },
                    tooltip: {
                        backgroundColor: currentTheme === "dark" ? "#222" : "#fff",
                        titleColor: currentTheme === "dark" ? "#fff" : "#000",
                        bodyColor: currentTheme === "dark" ? "#fff" : "#000",
                        borderColor: currentTheme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                const point = context.raw;
                                return point.event || "Event";
                            },
                        },
                    },
                    zoom: options.zoomPluginConfig,
                    backgroundColorPlugin: {
                        backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                        title: {
                            display: true,
                            text: "Time (minutes)",
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            callback: function (value) {
                                // Format seconds as MM:SS or HH:MM:SS
                                return formatTime(value);
                            },
                        },
                    },
                    y: {
                        display: false,
                    },
                },
            },
            plugins: ["backgroundColorPlugin"],
        };

        const chart = new window.Chart(canvas, config);
        if (chart) {
            // Apply enhanced animation configurations
            updateChartAnimations(chart, "Event Messages");
            window._chartjsInstances.push(chart);
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering event messages chart:", error);
    }
}

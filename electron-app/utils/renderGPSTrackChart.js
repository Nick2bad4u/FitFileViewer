import { detectCurrentTheme } from "./chartThemeUtils.js";
import { createChartCanvas } from "./createChartCanvas.js";

// GPS track chart renderer
export function renderGPSTrackChart(container, data, options) {
    try {
        console.log("[ChartJS] renderGPSTrackChart called");

        // Check if GPS position data is available
        const hasLatitude = data.some((row) => row.positionLat !== undefined && row.positionLat !== null);
        const hasLongitude = data.some((row) => row.positionLong !== undefined && row.positionLong !== null);

        if (!hasLatitude || !hasLongitude) {
            console.log("[ChartJS] No GPS position data available");
            return;
        }

        // Check field visibility
        const visibility = localStorage.getItem("chartjs_field_gps_track");
        if (visibility === "hidden") {
            return;
        }

        const currentTheme = detectCurrentTheme();

        // Convert GPS positions to chart data
        let gpsData = data
            .map((row, index) => {
                if (row.positionLat !== undefined && row.positionLat !== null && row.positionLong !== undefined && row.positionLong !== null) {
                    // Convert semicircle coordinates to degrees
                    const lat = (row.positionLat * 180) / Math.pow(2, 31);
                    const lng = (row.positionLong * 180) / Math.pow(2, 31);

                    return {
                        x: lng,
                        y: lat,
                        pointIndex: index,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (gpsData.length === 0) {
            console.log("[ChartJS] No valid GPS data points found");
            return;
        }

        // Apply data point limiting
        if (options.maxPoints !== "all" && gpsData.length > options.maxPoints) {
            const step = Math.ceil(gpsData.length / options.maxPoints);
            gpsData = gpsData.filter((_, i) => i % step === 0);
        }

        console.log(`[ChartJS] Creating GPS track chart with ${gpsData.length} points`);

        const canvas = createChartCanvas("gps-track", "gps-track");
        canvas.style.background = currentTheme === "dark" ? "#181c24" : "#ffffff";
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";
        container.appendChild(canvas);

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "GPS Track",
                        data: gpsData,
                        backgroundColor: "rgba(59, 130, 246, 0.8)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        pointRadius: options.showPoints ? 2 : 1,
                        pointHoverRadius: 4,
                        showLine: true,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
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
                        text: "GPS Track",
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
                                return [`Latitude: ${point.y.toFixed(6)}°`, `Longitude: ${point.x.toFixed(6)}°`, `Point: ${point.pointIndex}`];
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
                            text: "Longitude (°)",
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            callback: function (value) {
                                return value.toFixed(4) + "°";
                            },
                        },
                    },
                    y: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                        title: {
                            display: true,
                            text: "Latitude (°)",
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            callback: function (value) {
                                return value.toFixed(4) + "°";
                            },
                        },
                    },
                },
            },
            plugins: ["backgroundColorPlugin"],
        };

        const chart = new window.Chart(canvas, config);
        if (chart) {
            window._chartjsInstances.push(chart);
            console.log("[ChartJS] GPS track chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering GPS track chart:", error);
    }
}

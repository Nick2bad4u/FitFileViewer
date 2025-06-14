import { detectCurrentTheme } from "./chartThemeUtils.js";
import { convertValueToUserUnits } from "./convertValueToUserUnits.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { formatTooltipWithUnits } from "./formatTooltipWithUnits.js";
import { getUnitSymbol } from "./getUnitSymbol.js";
import { zoomResetPlugin } from "./zoomResetPlugin.js";

// Speed vs Distance chart
export function renderSpeedVsDistanceChart(container, data, options) {
    try {
        const hasSpeed = data.some(
            (row) => (row.speed !== undefined && row.speed !== null) || (row.enhancedSpeed !== undefined && row.enhancedSpeed !== null)
        );
        const hasDistance = data.some((row) => row.distance !== undefined && row.distance !== null);

        if (!hasSpeed || !hasDistance) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_speed_vs_distance");
        if (visibility === "hidden") {
            return;
        }

        const currentTheme = detectCurrentTheme();
        let chartData = data
            .map((row) => {
                const speed = row.enhancedSpeed || row.speed;
                const distance = row.distance;

                if (speed !== undefined && speed !== null && distance !== undefined && distance !== null) {
                    // Apply unit conversion based on user preferences
                    const convertedDistance = convertValueToUserUnits(distance, "distance");
                    const convertedSpeed = convertValueToUserUnits(speed, "speed");

                    return {
                        x: convertedDistance,
                        y: convertedSpeed,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (chartData.length === 0) return;

        // Apply data point limiting
        if (options.maxPoints !== "all" && chartData.length > options.maxPoints) {
            const step = Math.ceil(chartData.length / options.maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
        }

        const canvas = createChartCanvas("speed-vs-distance", "speed-vs-distance");
        canvas.style.background = currentTheme === "dark" ? "#181c24" : "#ffffff";
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";
        container.appendChild(canvas);

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Speed vs Distance",
                        data: chartData,
                        backgroundColor: "rgba(255, 255, 0, 0.6)",
                        borderColor: "rgba(255, 255, 0, 1)",
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
                        labels: { color: currentTheme === "dark" ? "#fff" : "#000" },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Speed vs Distance",
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
                                // Chart values are in user's preferred units, but we need raw values for tooltip
                                // Reverse convert to get raw meters/mps for the formatTooltipWithUnits function
                                const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
                                let rawDistance = context.parsed.x;
                                if (distanceUnits === "kilometers") {
                                    rawDistance = context.parsed.x * 1000; // Convert km back to meters
                                } else if (distanceUnits === "feet") {
                                    rawDistance = context.parsed.x / 3.28084; // Convert feet back to meters
                                } else if (distanceUnits === "miles") {
                                    rawDistance = context.parsed.x * 1609.344; // Convert miles back to meters
                                }

                                return [
                                    `Distance: ${formatTooltipWithUnits(rawDistance, "distance")}`,
                                    `Speed: ${formatTooltipWithUnits(context.parsed.y, "speed")}`,
                                ];
                            },
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "x",
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
                                backgroundColor: "rgba(255, 255, 0, 0.2)",
                                borderColor: "rgba(255, 255, 0, 0.8)",
                                borderWidth: 2,
                                modifierKey: "shift",
                            },
                            mode: "x",
                        },
                        limits: {
                            x: {
                                min: "original",
                                max: "original",
                            },
                            y: {
                                min: "original",
                                max: "original",
                            },
                        },
                    },
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
                            text: `Distance (${getUnitSymbol("distance")})`,
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: { color: currentTheme === "dark" ? "#fff" : "#000" },
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
                            text: `Speed (${getUnitSymbol("speed")})`,
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: { color: currentTheme === "dark" ? "#fff" : "#000" },
                    },
                },
            },
            plugins: [zoomResetPlugin, "backgroundColorPlugin"],
        };

        const chart = new window.Chart(canvas, config);
        if (chart) {
            window._chartjsInstances.push(chart);
            console.log("[ChartJS] Speed vs Distance chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering speed vs distance chart:", error);
    }
}

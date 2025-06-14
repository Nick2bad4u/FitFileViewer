import { detectCurrentTheme } from "./chartThemeUtils.js";
import { createChartCanvas } from "./createChartCanvas.js";

// Power vs Heart Rate chart
export function renderPowerVsHeartRateChart(container, data, options) {
    try {
        const hasPower = data.some((row) => row.power !== undefined && row.power !== null);
        const hasHeartRate = data.some((row) => row.heartRate !== undefined && row.heartRate !== null);

        if (!hasPower || !hasHeartRate) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_power_vs_hr");
        if (visibility === "hidden") {
            return;
        }

        const currentTheme = detectCurrentTheme();

        let chartData = data
            .map((row) => {
                if (row.power !== undefined && row.power !== null && row.heartRate !== undefined && row.heartRate !== null) {
                    return {
                        x: row.heartRate,
                        y: row.power,
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

        const canvas = createChartCanvas("power-vs-hr", "power-vs-hr");
        canvas.style.background = currentTheme === "dark" ? "#181c24" : "#ffffff";
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";
        container.appendChild(canvas);

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Power vs Heart Rate",
                        data: chartData,
                        backgroundColor: "rgba(245, 158, 11, 0.6)",
                        borderColor: "rgba(245, 158, 11, 1)",
                        pointRadius: options.showPoints ? 2 : 1,
                        pointHoverRadius: 4,
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
                        text: "Power vs Heart Rate",
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
                                return [`Heart Rate: ${context.parsed.x} bpm`, `Power: ${context.parsed.y} W`];
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
                            text: "Heart Rate (bpm)",
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
                            text: "Power (W)",
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: { color: currentTheme === "dark" ? "#fff" : "#000" },
                    },
                },
            },
            plugins: ["backgroundColorPlugin"],
        };

        const chart = new window.Chart(canvas, config);
        if (chart) {
            window._chartjsInstances.push(chart);
            console.log("[ChartJS] Power vs Heart Rate chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering power vs heart rate chart:", error);
    }
}

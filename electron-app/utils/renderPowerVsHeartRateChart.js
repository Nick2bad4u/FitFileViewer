import { getThemeConfig } from "./theme.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { chartZoomResetPlugin } from "./chartZoomResetPlugin.js";
import { chartBackgroundColorPlugin } from "./chartBackgroundColorPlugin.js";

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

        const themeConfig = getThemeConfig();

        let chartData = data
            .map((row) => {
                if (
                    row.power !== undefined &&
                    row.power !== null &&
                    row.heartRate !== undefined &&
                    row.heartRate !== null
                ) {
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
        canvas.style.background = themeConfig.colors.chartBackground;
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = `0 2px 16px 0 ${themeConfig.colors.shadow}`;
        container.appendChild(canvas);

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Power vs Heart Rate",
                        data: chartData,
                        backgroundColor: themeConfig.colors.warning + "99", // Orange with alpha
                        borderColor: themeConfig.colors.warning,
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
                        labels: { color: themeConfig.colors.text },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Power vs Heart Rate",
                        font: { size: 16, weight: "bold" },
                        color: themeConfig.colors.text,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        titleColor: themeConfig.colors.text,
                        bodyColor: themeConfig.colors.text,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return [`Heart Rate: ${context.parsed.x} bpm`, `Power: ${context.parsed.y} W`];
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
                                borderColor: themeConfig.colors.primary + "CC", // Primary with more opacity
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
                            y: {
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
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: themeConfig.colors.chartGrid,
                        },
                        title: {
                            display: true,
                            text: "Heart Rate (bpm)",
                            color: themeConfig.colors.text,
                        },
                        ticks: { color: themeConfig.colors.text },
                    },
                    y: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: themeConfig.colors.chartGrid,
                        },
                        title: {
                            display: true,
                            text: "Power (W)",
                            color: themeConfig.colors.text,
                        },
                        ticks: { color: themeConfig.colors.text },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
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

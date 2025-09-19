import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// Power vs Heart Rate chart
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options
 */
export function renderPowerVsHeartRateChart(container, data, options) {
    try {
        const hasHeartRate = data.some((row) => row.heartRate !== undefined && row.heartRate !== null),
            hasPower = data.some((row) => row.power !== undefined && row.power !== null);

        if (!hasPower || !hasHeartRate) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_power_vs_hr");
        if (visibility === "hidden") {
            return;
        }

        /** @type {any} */
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

        if (chartData.length === 0) {
            return;
        }

        // Apply data point limiting
        if (options.maxPoints !== "all" && chartData.length > options.maxPoints) {
            const step = Math.ceil(chartData.length / options.maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
        }

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("power-vs-hr", 0));
        if (themeConfig?.colors) {
            canvas.style.background = themeConfig.colors.chartBackground || "#000";
            canvas.style.boxShadow = themeConfig.colors.shadow ? `0 2px 16px 0 ${themeConfig.colors.shadow}` : "";
        }
        canvas.style.borderRadius = "12px";
        container.append(canvas);

        const config = {
                data: {
                    datasets: [
                        {
                            backgroundColor: `${themeConfig.colors.warning}99`, // Orange with alpha
                            borderColor: themeConfig.colors.warning,
                            data: chartData,
                            label: "Power vs Heart Rate",
                            pointHoverRadius: 4,
                            pointRadius: options.showPoints ? 2 : 1,
                        },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        chartBackgroundColorPlugin: {
                            backgroundColor: themeConfig.colors.chartBackground,
                        },
                        legend: {
                            display: options.showLegend,
                            labels: { color: themeConfig.colors.text },
                        },
                        title: {
                            color: themeConfig.colors.text,
                            display: options.showTitle,
                            font: { size: 16, weight: "bold" },
                            text: "Power vs Heart Rate",
                        },
                        tooltip: {
                            backgroundColor: themeConfig.colors.chartSurface,
                            bodyColor: themeConfig.colors.text,
                            borderColor: themeConfig.colors.chartBorder,
                            borderWidth: 1,
                            callbacks: {
                                /** @param {any} context */
                                label(context) {
                                    return [`Heart Rate: ${context.parsed.x} bpm`, `Power: ${context.parsed.y} W`];
                                },
                            },
                            titleColor: themeConfig.colors.text,
                        },
                        zoom: {
                            limits: {
                                x: {
                                    max: "original",
                                    min: "original",
                                },
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
                                    backgroundColor: themeConfig.colors.primaryAlpha,
                                    borderColor: `${themeConfig.colors.primary}CC`, // Primary with more opacity
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
                            display: true,
                            grid: {
                                color: themeConfig.colors.chartGrid,
                                display: options.showGrid,
                            },
                            ticks: { color: themeConfig.colors.text },
                            title: {
                                color: themeConfig.colors.text,
                                display: true,
                                text: "Heart Rate (bpm)",
                            },
                            type: "linear",
                        },
                        y: {
                            display: true,
                            grid: {
                                color: themeConfig.colors.chartGrid,
                                display: options.showGrid,
                            },
                            ticks: { color: themeConfig.colors.text },
                            title: {
                                color: themeConfig.colors.text,
                                display: true,
                                text: "Power (W)",
                            },
                            type: "linear",
                        },
                    },
                },
                plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
                type: "scatter",
            },
            chart = new /** @type {any} */ (globalThis).Chart(canvas, config);
        if (chart) {
            if (!(/** @type {any} */ (globalThis)._chartjsInstances)) {
                /** @type {any} */ globalThis._chartjsInstances = [];
            }
            /** @type {any} */ (globalThis)._chartjsInstances.push(chart);
            console.log("[ChartJS] Power vs Heart Rate chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering power vs heart rate chart:", error);
    }
}

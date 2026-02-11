import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";

// Power vs Heart Rate chart
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{
 *     maxPoints: number | "all";
 *     showPoints?: boolean;
 *     showLegend?: boolean;
 *     showTitle?: boolean;
 *     showGrid?: boolean;
 *     animationStyle?: string;
 *     theme?: string;
 * }} options
 */
export function renderPowerVsHeartRateChart(container, data, options) {
    try {
        const {
            animationStyle = "normal",
            theme = "auto",
            maxPoints = "all",
            showGrid,
            showLegend,
            showPoints,
            showTitle,
        } = options;

        const hasHeartRate = data.some(
                ({ heartRate }) => heartRate !== undefined && heartRate !== null
            ),
            hasPower = data.some(
                ({ power }) => power !== undefined && power !== null
            );

        if (!hasPower || !hasHeartRate) {
            return;
        }

        const visibility =
            chartSettingsManager.getFieldVisibility("power_vs_hr");
        if (visibility === "hidden") {
            return;
        }

        // Determine theme
        const currentTheme =
            theme && theme !== "auto" ? theme : detectCurrentTheme();
        /** @type {any} */
        const themeConfig = getThemeConfig();
        const { colors } = themeConfig || {};
        const isDark = currentTheme === "dark";
        const textColor = isDark ? "#fff" : "#000";
        const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const bgColor = isDark ? "#181c24" : "#ffffff";

        let chartData = data
            .map(({ heartRate, power }) => {
                if (
                    power !== undefined &&
                    power !== null &&
                    heartRate !== undefined &&
                    heartRate !== null
                ) {
                    return {
                        x: heartRate,
                        y: power,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (chartData.length === 0) {
            return;
        }

        // Apply data point limiting
        if (maxPoints !== "all" && chartData.length > maxPoints) {
            const step = Math.ceil(chartData.length / maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
        }

        const canvas = /** @type {HTMLCanvasElement} */ (
            createChartCanvas("power-vs-hr", 0)
        );
        canvas.style.background = bgColor;
        canvas.style.borderRadius = "12px";
        if (colors?.shadow) {
            canvas.style.boxShadow = `0 2px 16px 0 ${colors.shadow}`;
        }
        container.append(canvas);

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${colors.warning}99`, // Orange with alpha
                        borderColor: colors.warning,
                        data: chartData,
                        label: "Power vs Heart Rate",
                        pointHoverRadius: 4,
                        pointRadius: showPoints ? 2 : 1,
                    },
                ],
            },
            options: {
                animation: {
                    duration:
                        animationStyle === "none"
                            ? 0
                            : animationStyle === "fast"
                              ? 500
                              : animationStyle === "slow"
                                ? 2000
                                : 1000,
                    easing: "easeOutQuart",
                },
                maintainAspectRatio: false,
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor: bgColor,
                    },
                    legend: {
                        display: showLegend,
                        labels: { color: textColor },
                    },
                    title: {
                        color: textColor,
                        display: showTitle,
                        font: { size: 16, weight: "bold" },
                        text: "Power vs Heart Rate",
                    },
                    tooltip: {
                        backgroundColor: isDark ? "#222" : "#fff",
                        bodyColor: textColor,
                        borderColor: isDark ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                return [
                                    `Heart Rate: ${context.parsed.x} bpm`,
                                    `Power: ${context.parsed.y} W`,
                                ];
                            },
                        },
                        titleColor: textColor,
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
                                backgroundColor: colors.primaryAlpha,
                                borderColor: `${colors.primary}CC`, // Primary with more opacity
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
                                modifierKey: "ctrl",
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
                            color: gridColor,
                            display: showGrid,
                        },
                        ticks: { color: textColor },
                        title: {
                            color: textColor,
                            display: true,
                            text: "Heart Rate (bpm)",
                        },
                        type: "linear",
                    },
                    y: {
                        display: true,
                        grid: {
                            color: gridColor,
                            display: showGrid,
                        },
                        ticks: { color: textColor },
                        title: {
                            color: textColor,
                            display: true,
                            text: "Power (W)",
                        },
                        type: "linear",
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: "scatter",
        };

        const chart = createManagedChart(canvas, config);
        if (chart) {
            console.log(
                "[ChartJS] Power vs Heart Rate chart created successfully"
            );
        }
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering power vs heart rate chart:",
            error
        );
    }
}

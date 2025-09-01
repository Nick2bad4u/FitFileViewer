import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";

// Altitude profile with gradient visualization
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {number[]} labels
 * @param {{ maxPoints: number|"all", showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options
 */
export function renderAltitudeProfileChart(container, data, labels, options) {
    try {
        const hasAltitude = data.some(
            (row) =>
                (row.altitude !== undefined && row.altitude !== null) ||
                (row.enhancedAltitude !== undefined && row.enhancedAltitude !== null)
        );

        if (!hasAltitude) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_altitude_profile");
        if (visibility === "hidden") {
            return;
        }

        /** @type {any} */
        const themeConfig = getThemeConfig();

        let chartData = data
            .map((row, index) => {
                const altitude = row.enhancedAltitude || row.altitude;

                if (altitude !== undefined && altitude !== null) {
                    return {
                        x: labels[index],
                        y: altitude,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (chartData.length === 0) {return;}

        // Apply data point limiting
        if (options.maxPoints !== "all" && chartData.length > options.maxPoints) {
            const step = Math.ceil(chartData.length / options.maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
        }

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("altitude-profile", 0));
        if (themeConfig?.colors) {
            canvas.style.background = themeConfig.colors.chartBackground || "#000";
            canvas.style.boxShadow = themeConfig.colors.shadow ? `0 2px 16px 0 ${themeConfig.colors.shadow}` : "";
        }
        canvas.style.borderRadius = "12px";
        container.appendChild(canvas);

        const config = {
            type: "line",
            data: {
                datasets: [
                    {
                        label: "Altitude Profile",
                        data: chartData,
                        backgroundColor: `${themeConfig.colors.success  }4D`, // Green with alpha
                        borderColor: themeConfig.colors.success,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                        fill: "origin",
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
                        labels: { color: themeConfig.colors.textPrimary },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Altitude Profile",
                        font: { size: 16, weight: "bold" },
                        color: themeConfig.colors.textPrimary,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        titleColor: themeConfig.colors.textPrimary,
                        bodyColor: themeConfig.colors.textPrimary,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any[]} context */
                            title (context) {
                                return `Time: ${formatTime(context[0].parsed.x)}`;
                            },
                            /** @param {any} context */
                            label (context) {
                                return `Altitude: ${context.parsed.y.toFixed(1)} m`;
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
                                backgroundColor: themeConfig.colors.primaryAlpha,
                                borderColor: `${themeConfig.colors.primary  }CC`, // Primary with more opacity
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
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: {
                            color: themeConfig.colors.textPrimary,
                            /** @param {any} value */
                            callback (value) {
                                return formatTime(value, true);
                            },
                        },
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
                            text: "Altitude (m)",
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: { color: themeConfig.colors.textPrimary },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        },

         chart = new /** @type {any} */ (window).Chart(canvas, config);
        if (chart) {
            if (!(/** @type {any} */ (window)._chartjsInstances)) /** @type {any} */ {(window)._chartjsInstances = [];}
            /** @type {any} */ (window)._chartjsInstances.push(chart);
            console.log("[ChartJS] Altitude Profile chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering altitude profile chart:", error);
    }
}

import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { getChartEmoji, getChartIcon } from "../../ui/icons/iconMappings.js";
import { attachChartLabelMetadata } from "../components/attachChartLabelMetadata.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

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

        if (chartData.length === 0) {
            return;
        }

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

        const titleText = "Altitude Profile",
            altitudeUnit = getUnitSymbol("altitude") || "m",
            xLabel = `Time (${getUnitSymbol("time", "time")})`,
            yLabel = `Altitude (${altitudeUnit})`,
            accentColor = themeConfig?.colors?.success || themeConfig?.colors?.primary || "#22c55e",
            legendEmoji = getChartEmoji("altitude_profile"),
            datasetLabel = legendEmoji ? `${legendEmoji} ${titleText}` : titleText;

        attachChartLabelMetadata(canvas, {
            titleIcon: getChartIcon("altitude-profile"),
            titleText,
            titleColor: accentColor,
            xIcon: getChartIcon("time"),
            xText: xLabel,
            yIcon: getChartIcon("altitude"),
            yText: yLabel,
            yColor: accentColor,
        });

        container.append(canvas);

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${themeConfig.colors.success}4D`, // Green with alpha
                        borderColor: themeConfig.colors.success,
                        borderWidth: 2,
                        data: chartData,
                        fill: "origin",
                        label: datasetLabel,
                        pointHoverRadius: 4,
                        pointRadius: 0,
                        tension: 0.1,
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
                        labels: { color: themeConfig.colors.textPrimary },
                    },
                    title: {
                        color: "rgba(0,0,0,0)",
                        display: options.showTitle,
                        font: { size: 16, weight: "bold" },
                        text: titleText,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        bodyColor: themeConfig.colors.textPrimary,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                return `Altitude: ${context.parsed.y.toFixed(1)} m`;
                            },
                            /** @param {any[]} context */
                            title(context) {
                                return `Time: ${formatTime(context[0].parsed.x)}`;
                            },
                        },
                        titleColor: themeConfig.colors.textPrimary,
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
                            mode: "x",
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
                            mode: "x",
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
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                return formatTime(value, true);
                            },
                            color: themeConfig.colors.textPrimary,
                        },
                        title: {
                            color: "rgba(0,0,0,0)",
                            display: true,
                            text: xLabel,
                        },
                        type: "linear",
                    },
                    y: {
                        display: true,
                        grid: {
                            color: themeConfig.colors.chartGrid,
                            display: options.showGrid,
                        },
                        ticks: { color: themeConfig.colors.textPrimary },
                        title: {
                            color: "rgba(0,0,0,0)",
                            display: true,
                            text: yLabel,
                        },
                        type: "linear",
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: "line",
        },
            chart = new /** @type {any} */(globalThis).Chart(canvas, config);
        if (chart) {
            if (!(/** @type {any} */ (globalThis)._chartjsInstances)) {
                /** @type {any} */ globalThis._chartjsInstances = [];
            }
            /** @type {any} */ (globalThis)._chartjsInstances.push(chart);
            console.log("[ChartJS] Altitude Profile chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering altitude profile chart:", error);
    }
}

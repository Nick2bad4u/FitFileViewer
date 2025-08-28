import { getThemeConfig } from "../../theming/core/theme.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";

// Speed vs Distance chart
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options
 */
export function renderSpeedVsDistanceChart(container, data, options) {
    try {
        const hasSpeed = data.some(
            (row) =>
                (row.speed !== undefined && row.speed !== null) ||
                (row.enhancedSpeed !== undefined && row.enhancedSpeed !== null)
        );
        const hasDistance = data.some((row) => row.distance !== undefined && row.distance !== null);

        if (!hasSpeed || !hasDistance) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_speed_vs_distance");
        if (visibility === "hidden") {
            return;
        }

        /** @type {any} */
        const themeConfig = getThemeConfig();
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

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("speed-vs-distance", 0));
        if (themeConfig?.colors) {
            canvas.style.background = themeConfig.colors.chartBackground || "#000";
            canvas.style.boxShadow = themeConfig.colors.shadow ? `0 2px 16px 0 ${themeConfig.colors.shadow}` : "";
        }
        canvas.style.borderRadius = "12px";
        container.appendChild(canvas);

        const config = {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Speed vs Distance",
                        data: chartData,
                        backgroundColor: themeConfig.colors.warning + "99", // Yellow with alpha
                        borderColor: themeConfig.colors.warning,
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
                        labels: { color: themeConfig.colors.text },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Speed vs Distance",
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
                            /** @param {any} context */
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
                                backgroundColor: themeConfig.colors.warning + "33", // Yellow with alpha
                                borderColor: themeConfig.colors.warning + "CC", // Yellow with more opacity
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
                            text: `Distance (${getUnitSymbol("distance")})`,
                            color: themeConfig.colors.text,
                        },
                        ticks: { color: themeConfig.colors?.text },
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
                            text: `Speed (${getUnitSymbol("speed")})`,
                            color: themeConfig.colors.text,
                        },
                        ticks: { color: themeConfig.colors?.text },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        };

        const chart = new /** @type {any} */ (window).Chart(canvas, config);
        if (chart) {
            if (!(/** @type {any} */ (window)._chartjsInstances)) /** @type {any} */ (window)._chartjsInstances = [];
            /** @type {any} */ (window)._chartjsInstances.push(chart);
            console.log("[ChartJS] Speed vs Distance chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering speed vs distance chart:", error);
    }
}

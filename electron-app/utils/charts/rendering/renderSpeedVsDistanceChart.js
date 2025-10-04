import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { getChartIcon } from "../../ui/icons/iconMappings.js";
import { attachChartLabelMetadata } from "../components/attachChartLabelMetadata.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

// Speed vs Distance chart
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options
 */
export function renderSpeedVsDistanceChart(container, data, options) {
    try {
        const hasDistance = data.some((row) => row.distance !== undefined && row.distance !== null),
            hasSpeed = data.some(
                (row) =>
                    (row.speed !== undefined && row.speed !== null) ||
                    (row.enhancedSpeed !== undefined && row.enhancedSpeed !== null)
            );

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
                const speed = row.enhancedSpeed || row.speed,
                    { distance } = row;

                if (speed !== undefined && speed !== null && distance !== undefined && distance !== null) {
                    // Apply unit conversion based on user preferences
                    const convertedDistance = convertValueToUserUnits(distance, "distance"),
                        convertedSpeed = convertValueToUserUnits(speed, "speed");

                    return {
                        x: convertedDistance,
                        y: convertedSpeed,
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

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("speed-vs-distance", 0));
        if (themeConfig?.colors) {
            canvas.style.background = themeConfig.colors.chartBackground || "#000";
            canvas.style.boxShadow = themeConfig.colors.shadow ? `0 2px 16px 0 ${themeConfig.colors.shadow}` : "";
        }
        canvas.style.borderRadius = "12px";

        const titleText = "Speed vs Distance",
            xLabel = `Distance (${getUnitSymbol("distance")})`,
            yLabel = `Speed (${getUnitSymbol("speed")})`,
            accentColor = themeConfig?.colors?.warning || themeConfig?.colors?.primary || "#f59e0b";

        attachChartLabelMetadata(canvas, {
            titleIcon: getChartIcon("speed-vs-distance"),
            titleText,
            titleColor: accentColor,
            xIcon: getChartIcon("distance"),
            xText: xLabel,
            xColor: accentColor,
            yIcon: getChartIcon("speed"),
            yText: yLabel,
            yColor: themeConfig?.colors?.primary || accentColor,
        });

        container.append(canvas);

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${themeConfig.colors.warning}99`, // Yellow with alpha
                        borderColor: themeConfig.colors.warning,
                        borderWidth: 2,
                        data: chartData,
                        fill: false,
                        label: "Speed vs Distance",
                        pointHoverRadius: 4,
                        pointRadius: options.showPoints ? 2 : 1,
                        showLine: true,
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
                        labels: { color: themeConfig.colors.text },
                    },
                    title: {
                        color: "rgba(0,0,0,0)",
                        display: options.showTitle,
                        font: { size: 16, weight: "bold" },
                        text: titleText,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        bodyColor: themeConfig.colors.text,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                // Chart values are in user's preferred units, but we need raw values for tooltip
                                // Reverse convert to get raw meters/mps for the formatTooltipWithUnits function
                                const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
                                let rawDistance = context.parsed.x;
                                switch (distanceUnits) {
                                    case "feet": {
                                        rawDistance = context.parsed.x / 3.280_84; // Convert feet back to meters

                                        break;
                                    }
                                    case "kilometers": {
                                        rawDistance = context.parsed.x * 1000; // Convert km back to meters

                                        break;
                                    }
                                    case "miles": {
                                        rawDistance = context.parsed.x * 1609.344; // Convert miles back to meters

                                        break;
                                    }
                                    // No default
                                }

                                return [
                                    `Distance: ${formatTooltipWithUnits(rawDistance, "distance")}`,
                                    `Speed: ${formatTooltipWithUnits(context.parsed.y, "speed")}`,
                                ];
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
                            mode: "x",
                            modifierKey: null,
                        },
                        zoom: {
                            drag: {
                                backgroundColor: `${themeConfig.colors.warning}33`, // Yellow with alpha
                                borderColor: `${themeConfig.colors.warning}CC`, // Yellow with more opacity
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
                        ticks: { color: themeConfig.colors?.text },
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
                        ticks: { color: themeConfig.colors?.text },
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
            type: "scatter",
        },
            chart = new /** @type {any} */(globalThis).Chart(canvas, config);
        if (chart) {
            if (!(/** @type {any} */ (globalThis)._chartjsInstances)) {
                /** @type {any} */ globalThis._chartjsInstances = [];
            }
            /** @type {any} */ (globalThis)._chartjsInstances.push(chart);
            console.log("[ChartJS] Speed vs Distance chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering speed vs distance chart:", error);
    }
}

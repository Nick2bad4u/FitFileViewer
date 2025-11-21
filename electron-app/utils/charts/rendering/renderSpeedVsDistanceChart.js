import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";

// Speed vs Distance chart
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean, smoothing?: number, interpolation?: string, animationStyle?: string, theme?: string, distanceUnits?: string }} options
 */
export function renderSpeedVsDistanceChart(container, data, options) {
    try {
        const {
            animationStyle = "normal",
            distanceUnits = "kilometers",
            interpolation = "linear",
            smoothing = 0.1,
            theme = "auto",
            maxPoints = "all",
            showGrid,
            showLegend,
            showPoints,
            showTitle,
        } = options;

        const hasDistance = data.some(({ distance }) => distance !== undefined && distance !== null),
            hasSpeed = data.some(({ speed, enhancedSpeed }) => {
                const preferredSpeed = enhancedSpeed ?? speed;
                return preferredSpeed !== undefined && preferredSpeed !== null;
            });

        if (!hasSpeed || !hasDistance) {
            return;
        }

        const visibility = chartSettingsManager.getFieldVisibility("speed_vs_distance");
        if (visibility === "hidden") {
            return;
        }

        // Determine theme
        const currentTheme = theme && theme !== "auto" ? theme : detectCurrentTheme();
        /** @type {any} */
        const themeConfig = getThemeConfig();
        const { colors } = themeConfig || {};
        // Override colors if theme is forced and doesn't match config (simplified)
        const isDark = currentTheme === "dark";
        const textColor = isDark ? "#fff" : "#000";
        const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const bgColor = isDark ? "#181c24" : "#ffffff";

        let chartData = data
            .map(({ distance, enhancedSpeed, speed }) => {
                const preferredSpeed = enhancedSpeed ?? speed;

                if (
                    preferredSpeed !== undefined &&
                    preferredSpeed !== null &&
                    distance !== undefined &&
                    distance !== null
                ) {
                    // Apply unit conversion based on user preferences
                    const convertedDistance = convertValueToUserUnits(distance, "distance"),
                        convertedSpeed = convertValueToUserUnits(preferredSpeed, "speed"),
                        roundedSpeed = Math.round((convertedSpeed + Number.EPSILON) * 100) / 100;

                    return {
                        x: convertedDistance,
                        y: roundedSpeed,
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

        const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas("speed-vs-distance", 0));
        canvas.style.background = bgColor;
        canvas.style.borderRadius = "12px";
        if (colors?.shadow) {
            canvas.style.boxShadow = `0 2px 16px 0 ${colors.shadow}`;
        }
        container.append(canvas);

        // Configure interpolation
        let tension = smoothing;
        let stepped = false;
        let cubicInterpolationMode = "default";

        if (interpolation === "step") {
            stepped = true;
            tension = 0;
        } else if (interpolation === "monotone") {
            cubicInterpolationMode = "monotone";
        } else {
            stepped = false;
            cubicInterpolationMode = "default";
        }

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${colors.warning}99`, // Yellow with alpha
                        borderColor: colors.warning,
                        borderWidth: 2,
                        cubicInterpolationMode,
                        data: chartData,
                        fill: false,
                        label: "Speed vs Distance",
                        pointHoverRadius: 4,
                        pointRadius: showPoints ? 2 : 1,
                        showLine: true,
                        stepped,
                        tension,
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
                        text: "Speed vs Distance",
                    },
                    tooltip: {
                        backgroundColor: isDark ? "#222" : "#fff",
                        bodyColor: textColor,
                        borderColor: isDark ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                // Chart values are in user's preferred units, but we need raw values for tooltip
                                // Reverse convert to get raw meters/mps for the formatTooltipWithUnits function
                                // Use passed distanceUnits option instead of localStorage
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

                                let rawSpeed = context.parsed.y;
                                if (distanceUnits === "miles" || distanceUnits === "feet") {
                                    rawSpeed = context.parsed.y / 2.236_936;
                                } else {
                                    rawSpeed = context.parsed.y / 3.6;
                                }

                                return [
                                    `Distance: ${formatTooltipWithUnits(rawDistance, "distance")}`,
                                    `Speed: ${formatTooltipWithUnits(rawSpeed, "speed")}`,
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
                            mode: "x",
                            modifierKey: null,
                        },
                        zoom: {
                            drag: {
                                backgroundColor: `${colors.warning}33`, // Yellow with alpha
                                borderColor: `${colors.warning}CC`, // Yellow with more opacity
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
                            color: gridColor,
                            display: showGrid,
                        },
                        ticks: { color: textColor },
                        title: {
                            color: textColor,
                            display: true,
                            text: `Distance (${getUnitSymbol("distance")})`,
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
                            text: `Speed (${getUnitSymbol("speed")})`,
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
            console.log("[ChartJS] Speed vs Distance chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering speed vs distance chart:", error);
    }
}

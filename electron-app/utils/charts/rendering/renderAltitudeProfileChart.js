import { convertTimeUnits } from "../../formatting/converters/convertTimeUnits.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createManagedChart } from "../core/createManagedChart.js";
import { chartSettingsManager } from "../core/renderChartJS.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";

// Altitude profile with gradient visualization
/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {number[]} labels
 * @param {{
 *     maxPoints: number | "all";
 *     showLegend?: boolean;
 *     showTitle?: boolean;
 *     showGrid?: boolean;
 *     showFill?: boolean;
 *     smoothing?: number;
 *     interpolation?: string;
 *     animationStyle?: string;
 *     theme?: string;
 *     distanceUnits?: string;
 *     timeUnits?: string;
 * }} options
 */
export function renderAltitudeProfileChart(container, data, labels, options) {
    try {
        const {
            animationStyle = "normal",
            distanceUnits = "kilometers",
            interpolation = "linear",
            maxPoints = "all",
            showFill = true,
            showGrid,
            showLegend,
            showTitle,
            smoothing = 0.1,
            theme = "auto",
            timeUnits = "seconds",
        } = options;

        const hasAltitude = data.some(({ altitude, enhancedAltitude }) => {
            const preferredAltitude = enhancedAltitude ?? altitude;
            return (
                preferredAltitude !== undefined && preferredAltitude !== null
            );
        });

        if (!hasAltitude) {
            return;
        }

        const visibility =
            chartSettingsManager.getFieldVisibility("altitude_profile");
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
        const textColor = isDark ? "#fff" : "#000000";
        const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const bgColor = isDark ? "#181c24" : "#ffffff";

        let chartData = data
            .map(({ altitude, enhancedAltitude }, index) => {
                const preferredAltitude = enhancedAltitude ?? altitude;

                if (
                    preferredAltitude !== undefined &&
                    preferredAltitude !== null
                ) {
                    // Convert altitude if needed
                    let yVal = preferredAltitude;
                    if (distanceUnits === "feet" || distanceUnits === "miles") {
                        yVal = preferredAltitude * 3.280_84; // Convert meters to feet
                    }

                    return {
                        x: labels[index],
                        y: yVal,
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
            createChartCanvas("altitude-profile", 0)
        );
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

        const altUnit =
            distanceUnits === "feet" || distanceUnits === "miles" ? "ft" : "m";

        const config = {
            data: {
                datasets: [
                    {
                        backgroundColor: `${colors.success}4D`, // Green with alpha
                        borderColor: colors.success,
                        borderWidth: 2,
                        cubicInterpolationMode,
                        data: chartData,
                        fill: showFill ? "origin" : false,
                        label: "Altitude Profile",
                        pointHoverRadius: 4,
                        pointRadius: 0,
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
                        text: "Altitude Profile",
                    },
                    tooltip: {
                        backgroundColor: isDark ? "#222" : "#f5f5f5",
                        bodyColor: textColor,
                        borderColor: isDark ? "#555" : "#cccccc",
                        borderWidth: 1,
                        callbacks: {
                            /** @param {any} context */
                            label(context) {
                                return `Altitude: ${context.parsed.y.toFixed(1)} ${altUnit}`;
                            },
                            /** @param {any[]} context */
                            title(context) {
                                const val = context[0].parsed.x;
                                const converted = convertTimeUnits(
                                    val,
                                    timeUnits
                                );
                                if (timeUnits === "hours")
                                    return `Time: ${converted.toFixed(2)}h`;
                                if (timeUnits === "minutes")
                                    return `Time: ${converted.toFixed(1)}m`;
                                return `Time: ${formatTime(val)}`;
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
                                backgroundColor: colors.primaryAlpha,
                                borderColor: `${colors.primary}CC`, // Primary with more opacity
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
                        ticks: {
                            /** @param {any} value */
                            callback(value) {
                                const converted = convertTimeUnits(
                                    value,
                                    timeUnits
                                );
                                if (timeUnits === "hours")
                                    return `${converted.toFixed(2)}h`;
                                if (timeUnits === "minutes")
                                    return `${converted.toFixed(1)}m`;
                                return formatTime(value, true);
                            },
                            color: textColor,
                        },
                        title: {
                            color: textColor,
                            display: true,
                            text: `Time (${timeUnits === "hours" ? "h" : timeUnits === "minutes" ? "min" : "s"})`,
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
                            text: `Altitude (${altUnit})`,
                        },
                        type: "linear",
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: "line",
        };

        const chart = createManagedChart(canvas, config);
        if (chart) {
            console.log(
                "[ChartJS] Altitude Profile chart created successfully"
            );
        }
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering altitude profile chart:",
            error
        );
    }
}

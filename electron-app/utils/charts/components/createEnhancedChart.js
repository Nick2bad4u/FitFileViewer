import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertTimeUnits } from "../../formatting/converters/convertTimeUnits.js";
import { formatTooltipWithUnits } from "../../formatting/display/formatTooltipWithUnits.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { hexToRgba } from "../core/renderChartJS.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { getFieldColor } from "../theming/getFieldColor.js";

// Enhanced chart creation function
/**
 * @param {any} canvas
 * @param {any} options
 */
export function createEnhancedChart(canvas, options) {
    const {
        animationStyle,
        axisRanges,
        chartData,
        chartType,
        customColors,
        decimation = { enabled: false },
        enableSpanGaps = false,
        field,
        fieldLabels,
        interpolation,
        showFill,
        showGrid,
        showLegend,
        showPoints,
        showTitle,
        smoothing,
        tickSampleSize,
        theme,
        zoomPluginConfig,
    } = options;
    try {
        // Get theme using robust detection
        const currentTheme = detectCurrentTheme();
        console.log("[ChartJS] Theme debugging for field:", field);
        console.log("[ChartJS] - theme param:", theme);
        console.log("[ChartJS] - detectCurrentTheme():", currentTheme);

        // Get field color
        const fieldColor = customColors[field] || getFieldColor(field),
            // Configure dataset based on chart type
            dataset = {
                backgroundColor: showFill ? hexToRgba(fieldColor, 0.2) : "transparent",
                borderColor: fieldColor,
                borderWidth: 2,
                data: chartData,
                parsing: false,
                fill: showFill,
                label: fieldLabels[field] || field,
                pointBackgroundColor: fieldColor,
                pointBorderColor: fieldColor,
                pointHoverRadius: 5,
                pointRadius: showPoints ? 3 : 0,
                spanGaps: enableSpanGaps,
                tension: smoothing / 100,
            };

        // Adjust dataset for chart type
        if (chartType === "bar") {
            dataset.backgroundColor = fieldColor;
            dataset.borderWidth = 1;
        } else if (chartType === "scatter") {
            /** @type {any} */ (dataset).showLine = false;
            dataset.pointRadius = 4;
        }

        // Chart configuration
        const config = {
            data: {
                datasets: [dataset],
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
                    easing: interpolation,
                },
                interaction: {
                    intersect: false,
                    mode: "index",
                },
                maintainAspectRatio: false,
                normalized: true,
                parsing: false,
                spanGaps: enableSpanGaps,
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                    },
                    decimation,
                    legend: {
                        display: showLegend,
                        labels: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            font: {
                                size: 12,
                            },
                            usePointStyle: true,
                        },
                        position: "top",
                    },
                    title: {
                        color: currentTheme === "dark" ? "#fff" : "#000",
                        display: showTitle,
                        font: {
                            size: 16,
                            weight: "bold",
                        },
                        padding: 20,
                        text: `${fieldLabels[field] || field} (${getUnitSymbol(field)})`,
                    },
                    tooltip: {
                        backgroundColor: currentTheme === "dark" ? "#222" : "#fff",
                        bodyColor: currentTheme === "dark" ? "#fff" : "#000",
                        borderColor: currentTheme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            /**
                             * @param {any} context
                             */
                            label(context) {
                                const value = context.parsed.y;

                                // Use enhanced tooltip formatting with unit conversion
                                // For chart data, we need to get the original raw value for tooltip
                                // Since chart data is already converted, we need to convert back for tooltip display
                                let rawValue = value;

                                // Convert chart value back to raw value for tooltip formatting
                                if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
                                    const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
                                    switch (distanceUnits) {
                                        case "feet": {
                                            rawValue = value / 3.280_84; // Convert feet back to meters
                                            break;
                                        }
                                        case "kilometers": {
                                            rawValue = value * 1000; // Convert km back to meters
                                            break;
                                        }
                                        case "miles": {
                                            rawValue = value * 1609.344; // Convert miles back to meters
                                            break;
                                        }
                                        default: {
                                            rawValue = value;
                                        } // Already in meters
                                    }
                                } else if (field === "temperature") {
                                    const temperatureUnits =
                                        localStorage.getItem("chartjs_temperatureUnits") || "celsius";
                                    if (temperatureUnits === "fahrenheit") {
                                        rawValue = ((value - 32) * 5) / 9; // Convert F back to C
                                    }
                                }

                                // Use the enhanced tooltip formatting
                                return `${context.dataset.label}: ${formatTooltipWithUnits(rawValue, field)}`;
                            },
                            /**
                             * @param {any} context
                             */
                            title(context) {
                                return context[0].label;
                            },
                        },
                        cornerRadius: 6,
                        displayColors: true,
                        titleColor: currentTheme === "dark" ? "#fff" : "#000",
                    },
                    zoom: zoomPluginConfig,
                },
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            display: showGrid,
                        },
                        ticks: {
                            /**
                             * @param {any} value
                             */
                            callback(value) {
                                // Convert time based on user preference for display
                                const timeUnits = localStorage.getItem("chartjs_timeUnits") || "seconds",
                                    convertedValue = convertTimeUnits(value, timeUnits);

                                // Format based on selected units
                                if (timeUnits === "hours") {
                                    return `${convertedValue.toFixed(2)}h`;
                                } else if (timeUnits === "minutes") {
                                    return `${convertedValue.toFixed(1)}m`;
                                }
                                // For seconds, use the formatTime function for MM:SS display
                                return formatTime(value);
                            },
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            ...(tickSampleSize ? { sampleSize: tickSampleSize } : {}),
                        },
                        title: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            display: true,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            text: `Time (${getUnitSymbol("time", "time")})`,
                        },
                        type: "linear",
                        ...(axisRanges &&
                        axisRanges.x &&
                        Number.isFinite(axisRanges.x.min) &&
                        Number.isFinite(axisRanges.x.max)
                            ? axisRanges.x.min === axisRanges.x.max
                                ? {
                                      max: axisRanges.x.max + 1,
                                      min: Math.max(axisRanges.x.min - 1, 0),
                                  }
                                : {
                                      max: axisRanges.x.max,
                                      min: axisRanges.x.min,
                                  }
                            : {}),
                    },
                    y: {
                        display: true,
                        grid: {
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            display: showGrid,
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        title: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            display: true,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            text: `${fieldLabels[field] || field} (${getUnitSymbol(field)})`,
                        },
                        ...(axisRanges &&
                        axisRanges.y &&
                        Number.isFinite(axisRanges.y.min) &&
                        Number.isFinite(axisRanges.y.max)
                            ? axisRanges.y.min === axisRanges.y.max
                                ? {
                                      max: axisRanges.y.max + 1,
                                      min: axisRanges.y.min - 1,
                                  }
                                : {
                                      max: axisRanges.y.max,
                                      min: axisRanges.y.min,
                                  }
                            : {}),
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: chartType === "area" ? "line" : chartType,
        };

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

        // Create and return chart
        const chart = new globalThis.Chart(canvas, config);

        // Apply enhanced animation configurations
        if (chart && animationStyle !== "none") {
            updateChartAnimations(chart, field);
        }

        return chart;
    } catch (error) {
        console.error(`[ChartJS] Error creating chart for ${field}:`, error);
        showNotification(`Error creating chart for ${field}`, "error", 5000);
        return null;
    }
}

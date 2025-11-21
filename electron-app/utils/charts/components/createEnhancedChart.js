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
        timeUnits = "seconds",
        distanceUnits = "kilometers",
        temperatureUnits = "celsius",
    } = options;

    function getLocalUnitSymbol(f, type) {
        if (type === "time") {
            return timeUnits === "hours" ? "h" : timeUnits === "minutes" ? "min" : "s";
        }
        if (f === "distance" || f === "altitude" || f === "enhancedAltitude") {
            return distanceUnits === "miles"
                ? "mi"
                : distanceUnits === "feet"
                  ? "ft"
                  : distanceUnits === "meters"
                    ? "m"
                    : "km";
        }
        if (f === "temperature") {
            return temperatureUnits === "fahrenheit" ? "°F" : "°C";
        }
        if (f === "speed" || f === "enhancedSpeed") {
            return distanceUnits === "miles" || distanceUnits === "feet" ? "mph" : "km/h";
        }
        return getUnitSymbol(f);
    }

    try {
        // Get theme using robust detection
        // If theme param is provided and not 'auto', use it. Otherwise detect.
        const currentTheme = theme && theme !== "auto" ? theme : detectCurrentTheme();
        console.log("[ChartJS] Theme debugging for field:", field);
        console.log("[ChartJS] - theme param:", theme);
        console.log("[ChartJS] - resolved theme:", currentTheme);

        // Configure dataset interpolation
        let tension = smoothing / 100;
        let stepped = false;
        let cubicInterpolationMode = "default";

        if (interpolation === "step") {
            stepped = true;
            tension = 0;
        } else if (interpolation === "monotone") {
            cubicInterpolationMode = "monotone";
        } else {
            // linear / default
            stepped = false;
            cubicInterpolationMode = "default";
        }

        // Get field color
        const fieldColor = customColors[field] || getFieldColor(field),
            // Configure dataset based on chart type
            dataset = {
                backgroundColor: showFill ? hexToRgba(fieldColor, 0.2) : "transparent",
                borderColor: fieldColor,
                borderWidth: 2,
                cubicInterpolationMode,
                data: chartData,
                parsing: false,
                fill: showFill,
                label: fieldLabels[field] || field,
                pointBackgroundColor: fieldColor,
                pointBorderColor: fieldColor,
                pointHoverRadius: 5,
                pointRadius: showPoints ? 3 : 0,
                spanGaps: enableSpanGaps,
                stepped,
                tension,
            };

        // Adjust dataset for chart type
        if (chartType === "bar") {
            dataset.backgroundColor = fieldColor;
            dataset.borderWidth = 1;
            // Bar charts don't use tension/stepped in the same way, but it's fine to have them
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
                    easing:
                        animationStyle === "fast"
                            ? "easeInOut"
                            : animationStyle === "none" || animationStyle === "normal" || !animationStyle
                              ? "linear"
                              : "easeOutQuart",
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
                        text: `${fieldLabels[field] || field} (${getLocalUnitSymbol(field)})`,
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

                                // Values in chartData have already been converted to user units
                                // via convertValueToUserUnits in renderChartJS. For distance,
                                // altitude, speed and temperature we need to convert back to
                                // canonical raw units before delegating to formatTooltipWithUnits,
                                // which expects raw values.
                                let rawValue = value;

                                switch (field) {
                                    case "altitude":
                                    case "distance":
                                    case "enhancedAltitude": {
                                        switch (distanceUnits) {
                                            case "feet": {
                                                // value is in feet, convert back to meters
                                                rawValue = value / 3.280_84;
                                                break;
                                            }
                                            case "kilometers": {
                                                // value is in kilometers, convert back to meters
                                                rawValue = value * 1000;
                                                break;
                                            }
                                            case "miles": {
                                                // value is in miles, convert back to meters
                                                rawValue = value * 1609.344;
                                                break;
                                            }
                                            default: {
                                                // meters or unknown
                                                rawValue = value;
                                            }
                                        }
                                        break;
                                    }
                                    case "enhancedSpeed":
                                    case "speed": {
                                        // chartData speed is in km/h or mph depending on distance units.
                                        // Convert back to m/s which is the raw canonical unit.
                                        if (distanceUnits === "miles" || distanceUnits === "feet") {
                                            // value is mph
                                            rawValue = value / 2.236_936;
                                        } else {
                                            // value is km/h
                                            rawValue = value / 3.6;
                                        }
                                        break;
                                    }
                                    case "temperature": {
                                        // chartData temperature is in Celsius or Fahrenheit.
                                        // Convert back to Celsius for tooltip helper.
                                        if (temperatureUnits === "fahrenheit") {
                                            rawValue = ((value - 32) * 5) / 9;
                                        }
                                        break;
                                    }
                                    // Other fields already store canonical raw values
                                    default: {
                                        rawValue = value;
                                    }
                                }

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
                                const convertedValue = convertTimeUnits(value, timeUnits);

                                if (timeUnits === "hours") {
                                    return `${convertedValue.toFixed(2)}h`;
                                } else if (timeUnits === "minutes") {
                                    return `${convertedValue.toFixed(1)}m`;
                                }
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
                            text: `Time (${getLocalUnitSymbol("time", "time")})`,
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
                            text: `${fieldLabels[field] || field} (${getLocalUnitSymbol(field)})`,
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

/**
 * Helper function to determine unit symbol based on passed options.
 * @param {string} f - The field for which to get the unit symbol.
 * @param {string} type - The type of unit, e.g., "time".
 * @returns {string} - The unit symbol.
 */

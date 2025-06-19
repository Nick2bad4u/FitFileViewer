import { detectCurrentTheme } from "./chartThemeUtils.js";
import { convertTimeUnits } from "./convertTimeUnits.js";
import { formatTime } from "./formatTime.js";
import { formatTooltipWithUnits } from "./formatTooltipWithUnits.js";
import { getUnitSymbol } from "./getUnitSymbol.js";
import { hexToRgba } from "./renderChartJS.js";
import { getFieldColor } from "./getFieldColor.js";
import { chartZoomResetPlugin } from "./chartZoomResetPlugin.js";
import { chartBackgroundColorPlugin } from "./chartBackgroundColorPlugin.js";
import { showNotification } from "./showNotification.js";
import { updateChartAnimations } from "./updateChartAnimations.js";

// Enhanced chart creation function
export function createEnhancedChart(canvas, options) {
    const {
        field,
        chartData,
        chartType,
        interpolation,
        animationStyle,
        showGrid,
        showLegend,
        showTitle,
        showPoints,
        showFill,
        smoothing,
        customColors,
        zoomPluginConfig,
        fieldLabels,
        theme,
    } = options;
    try {
        // Get theme using robust detection
        const currentTheme = detectCurrentTheme();
        console.log("[ChartJS] Theme debugging for field:", field);
        console.log("[ChartJS] - theme param:", theme);
        console.log("[ChartJS] - detectCurrentTheme():", currentTheme);

        // Get field color
        const fieldColor = customColors[field] || getFieldColor(field);

        // Configure dataset based on chart type
        const dataset = {
            label: fieldLabels[field] || field,
            data: chartData,
            borderColor: fieldColor,
            backgroundColor: showFill ? hexToRgba(fieldColor, 0.2) : "transparent",
            pointBackgroundColor: fieldColor,
            pointBorderColor: fieldColor,
            pointRadius: showPoints ? 3 : 0,
            pointHoverRadius: 5,
            fill: showFill,
            tension: smoothing / 100,
            borderWidth: 2,
        };

        // Adjust dataset for chart type
        if (chartType === "bar") {
            dataset.backgroundColor = fieldColor;
            dataset.borderWidth = 1;
        } else if (chartType === "scatter") {
            dataset.showLine = false;
            dataset.pointRadius = 4;
        }

        // Chart configuration
        const config = {
            type: chartType === "area" ? "line" : chartType,
            data: {
                datasets: [dataset],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index",
                },
                plugins: {
                    legend: {
                        display: showLegend,
                        position: "top",
                        labels: {
                            usePointStyle: true,
                            font: {
                                size: 12,
                            },
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                    },
                    title: {
                        display: showTitle,
                        text: `${fieldLabels[field] || field} (${getUnitSymbol(field)})`,
                        font: {
                            size: 16,
                            weight: "bold",
                        },
                        padding: 20,
                        color: currentTheme === "dark" ? "#fff" : "#000",
                    },
                    tooltip: {
                        backgroundColor: currentTheme === "dark" ? "#222" : "#fff",
                        titleColor: currentTheme === "dark" ? "#fff" : "#000",
                        bodyColor: currentTheme === "dark" ? "#fff" : "#000",
                        borderColor: currentTheme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                const value = context.parsed.y;

                                // Use enhanced tooltip formatting with unit conversion
                                // For chart data, we need to get the original raw value for tooltip
                                // Since chart data is already converted, we need to convert back for tooltip display
                                let rawValue = value;

                                // Convert chart value back to raw value for tooltip formatting
                                if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
                                    const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
                                    switch (distanceUnits) {
                                        case "kilometers":
                                            rawValue = value * 1000; // Convert km back to meters
                                            break;
                                        case "feet":
                                            rawValue = value / 3.28084; // Convert feet back to meters
                                            break;
                                        case "miles":
                                            rawValue = value * 1609.344; // Convert miles back to meters
                                            break;
                                        default:
                                            rawValue = value; // Already in meters
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
                        },
                    },
                    zoom: zoomPluginConfig,
                    chartBackgroundColorPlugin: {
                        backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: showGrid,
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                            callback: function (value) {
                                // Convert time based on user preference for display
                                const timeUnits = localStorage.getItem("chartjs_timeUnits") || "seconds";
                                const convertedValue = convertTimeUnits(value, timeUnits);

                                // Format based on selected units
                                if (timeUnits === "hours") {
                                    return convertedValue.toFixed(2) + "h";
                                } else if (timeUnits === "minutes") {
                                    return convertedValue.toFixed(1) + "m";
                                } else {
                                    // For seconds, use the formatTime function for MM:SS display
                                    return formatTime(value);
                                }
                            },
                        },
                    },
                    y: {
                        display: true,
                        grid: {
                            display: showGrid,
                            color: currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                        title: {
                            display: true,
                            text: `${fieldLabels[field] || field} (${getUnitSymbol(field)})`,
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                        ticks: {
                            color: currentTheme === "dark" ? "#fff" : "#000",
                        },
                    },
                },
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
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
        };

        // Apply theme-aware canvas styling (background handled by plugin)
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

        // Create and return chart
        const chart = new window.Chart(canvas, config);

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

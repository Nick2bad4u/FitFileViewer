import { detectCurrentTheme } from "./chartThemeUtils.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { formatTime } from "./formatTime.js";
import { getZoneTypeFromField, getChartZoneColors } from "./chartZoneColorUtils.js";
import { getThemeConfig } from "./theme.js";
import { chartBackgroundColorPlugin } from "./chartBackgroundColorPlugin.js";

// Helper function to render individual zone chart

export function renderZoneChart(container, title, zoneData, chartId, options = {}) {
    console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);

    const themeConfig = getThemeConfig();
    const currentTheme = detectCurrentTheme();

    // Determine chart type from options or default to doughnut
    const chartType = options.chartType || "doughnut";

    const canvas = createChartCanvas(chartId, chartId);

    // Apply theme-aware canvas styling (background handled by plugin)
    canvas.style.borderRadius = "12px";
    canvas.style.boxShadow = `0 2px 16px 0 ${themeConfig.colors.shadowLight}`;

    container.appendChild(canvas); // Determine zone type and get user-selected colors from theme
    let colors = themeConfig.colors.zoneColors; // Check if zone data has color properties (from applyZoneColors), otherwise use saved colors
    if (zoneData.length > 0 && zoneData[0].color) {
        // Use colors from the zone data objects
        colors = zoneData.map((zone) => zone.color);
    } else {
        // Fall back to getting saved colors by zone type
        const zoneType = getZoneTypeFromField(chartId);
        if (zoneType) {
            colors = getChartZoneColors(zoneType, zoneData.length);
        }
    } // Create chart configuration based on type
    const config = createChartConfig(chartType, zoneData, colors, title, options, currentTheme);

    console.log(`[ChartJS] Creating ${chartType} zone chart with config:`, config);
    const chart = new window.Chart(canvas, config);
    if (chart) {
        console.log(`[ChartJS] Zone chart created successfully for ${title}`);
        window._chartjsInstances.push(chart);
    } else {
        console.error(`[ChartJS] Failed to create zone chart for ${title}`);
    }
}

/**
 * Creates chart configuration based on chart type
 * @param {string} chartType - "doughnut" or "bar"
 * @param {Array} zoneData - Zone data array
 * @param {Array} colors - Colors array
 * @param {string} title - Chart title
 * @param {Object} options - Chart options
 * @param {string} currentTheme - Current theme
 * @returns {Object} Chart.js configuration object
 */
function createChartConfig(chartType, zoneData, colors, title, options, currentTheme) {
    const baseDataset = {
        data: zoneData.map((zone) => zone.time || 0),
        backgroundColor: colors.slice(0, zoneData.length),
        borderColor: currentTheme === "dark" ? "#333" : "#fff",
        borderWidth: chartType === "doughnut" ? 3 : 1,
    };

    if (chartType === "bar") {
        return createBarChartConfig(zoneData, colors, title, options, currentTheme, baseDataset);
    } else {
        return createDoughnutChartConfig(zoneData, colors, title, options, currentTheme, baseDataset);
    }
}

/**
 * Creates doughnut chart configuration
 */
function createDoughnutChartConfig(zoneData, colors, title, options, currentTheme, baseDataset) {
    return {
        type: "doughnut",
        data: {
            labels: zoneData.map((zone) => zone.label || `Zone ${zone.zone || 1}`),
            datasets: [
                {
                    ...baseDataset,
                    borderAlign: "center",
                    borderRadius: 4,
                    borderJoinStyle: "round",
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        return `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9)`;
                    }),
                    hoverBorderColor: "#ffffff",
                    hoverBorderWidth: 4,
                    hoverOffset: 8,
                    offset: 2,
                    spacing: 2,
                    rotation: -90, // Start from top
                    circumference: 360, // Full circle
                    weight: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            // Creates a nice donut hole
            radius: "90%",
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    padding: 20,
                },
                legend: {
                    display: options.showLegend !== false,
                    position: "right",
                    onClick: function (event, legendItem, legend) {
                        // Get the chart instance and dataset meta
                        const chart = legend.chart;
                        const index = legendItem.index;
                        const meta = chart.getDatasetMeta(0);

                        // Toggle visibility
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    },
                    labels: {
                        display: true,
                        font: {
                            size: 14,
                            weight: "600",
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: "circle",
                        generateLabels: function (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                const dataset = data.datasets[0];
                                const total = dataset.data.reduce((a, b) => a + b, 0);

                                return data.labels.map((label, i) => {
                                    const value = dataset.data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    const meta = chart.getDatasetMeta(0);
                                    const hidden = meta.data[i] && meta.data[i].hidden;
                                    return {
                                        text: `${label}: ${formatTime(value, true)} (${percentage}%)`,
                                        fillStyle: hidden ? "rgba(128, 128, 128, 0.5)" : dataset.backgroundColor[i],
                                        strokeStyle: hidden ? "rgba(128, 128, 128, 0.5)" : dataset.backgroundColor[i],
                                        fontColor: hidden
                                            ? "rgba(128, 128, 128, 0.7)"
                                            : currentTheme === "dark"
                                              ? "#ffffff"
                                              : "#333333",
                                        lineWidth: 1,
                                        hidden: hidden,
                                        index: i,
                                        pointStyle: "circle",
                                    };
                                });
                            }
                            return [];
                        },
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    },
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: currentTheme === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor: currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            const timeFormatted = formatTime(context.parsed, true);
                            return [`Time: ${timeFormatted}`, `Percentage: ${percentage}%`];
                        },
                        labelColor: function (context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                                borderWidth: 2,
                                borderRadius: 2,
                            };
                        },
                    },
                },
                chartBackgroundColorPlugin: {
                    backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: "easeOutQuart",
            },
            interaction: {
                intersect: false,
                mode: "point",
            },
            elements: {
                arc: {
                    borderWidth: 3,
                    borderColor: "#ffffff",
                    hoverBorderWidth: 4,
                },
            },
        },
        plugins: [chartBackgroundColorPlugin],
    };
}

/**
 * Creates bar chart configuration
 */
function createBarChartConfig(zoneData, colors, title, options, currentTheme, baseDataset) {
    return {
        type: "bar",
        data: {
            labels: zoneData.map((zone) => zone.label || `Zone ${zone.zone || 1}`),
            datasets: [
                {
                    ...baseDataset,
                    label: "Time in Zone",
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        return `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, 0.9)`;
                    }),
                    hoverBorderColor: colors.slice(0, zoneData.length),
                    hoverBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    padding: 20,
                },
                legend: {
                    display: false, // Single dataset, no need for legend
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: currentTheme === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor: currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.y;
                            const timeFormatted = formatTime(value, true);
                            return `Time: ${timeFormatted}`;
                        },
                        labelColor: function (context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                                borderWidth: 2,
                                borderRadius: 2,
                            };
                        },
                    },
                },
                chartBackgroundColorPlugin: {
                    backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        lineWidth: 1,
                    },
                    ticks: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 12,
                        },
                        callback: function (value) {
                            return formatTime(value, true);
                        },
                    },
                    title: {
                        display: true,
                        text: "Time",
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                    },
                },
                x: {
                    grid: {
                        color: currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        lineWidth: 1,
                    },
                    ticks: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 12,
                            weight: "600",
                        },
                    },
                    title: {
                        display: true,
                        text: "Zone",
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                    },
                },
            },
            animation: {
                duration: 1500,
                easing: "easeOutQuart",
            },
            interaction: {
                intersect: false,
                mode: "index",
            },
        },
        plugins: [chartBackgroundColorPlugin],
    };
}

import { getChartZoneColors, getZoneTypeFromField } from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { getZoneChartEmoji } from "../../ui/icons/iconMappings.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { addChartHoverEffects } from "../plugins/addChartHoverEffects.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";

// Helper function to render individual zone chart
/**
 * Render a zone chart (doughnut or bar)
 * @param {HTMLElement} container
 * @param {string} title
 * @param {import("../../types/sharedChartTypes.d.ts").ZoneData[]} zoneData
 * @param {string} chartId
 * @param {{ chartType?: string, showLegend?: boolean }} [options]
 * @returns {void}
 */
export function renderZoneChart(container, title, zoneData, chartId, options = {}) {
    if (!(container instanceof HTMLElement)) {
        console.warn("renderZoneChart: invalid container", container);
        return;
    }
    if (!Array.isArray(zoneData)) {
        console.warn("renderZoneChart: zoneData not array", zoneData);
        return;
    }
    console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);

    /** @type {any} */
    const // CreateChartCanvas expects (field: string, index: number). Using 0 index since zone charts are singular per id.
        canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas(chartId, 0)),
        // Determine chart type from options or default to doughnut
        chartType = options.chartType || "doughnut",
        currentTheme = detectCurrentTheme(),
        themeConfig = getThemeConfig();

    // Apply theme-aware canvas styling (background handled by plugin)
    canvas.style.borderRadius = "12px";
    if (themeConfig?.colors?.shadowLight && canvas.style) {
        canvas.style.boxShadow = `0 2px 16px 0 ${themeConfig.colors.shadowLight}`;
    }

    container.append(canvas); // Determine zone type and get user-selected colors from theme
    let colors = themeConfig?.colors?.zoneColors || []; // Check if zone data has color properties (from applyZoneColors), otherwise use saved colors
    if (zoneData.length > 0 && zoneData[0] && zoneData[0].color) {
        // Use colors from the zone data objects
        colors = zoneData.map((zone) => zone.color);
    } else {
        // Fall back to getting saved colors by zone type
        const zoneType = getZoneTypeFromField(chartId);
        if (zoneType) {
            colors = getChartZoneColors(zoneType, zoneData.length);
        }
    } // Create chart configuration based on type
    const config = createChartConfig(chartType, zoneData, colors, title, options, currentTheme, chartId);

    console.log(`[ChartJS] Creating ${chartType} zone chart with config:`, config);
    const ChartCtor = /** @type {any} */ (globalThis.Chart),
        chart = ChartCtor ? new ChartCtor(canvas, config) : null;
    if (chart && Array.isArray(globalThis._chartjsInstances)) {
        console.log(`[ChartJS] Zone chart created successfully for ${title}`);
        globalThis._chartjsInstances.push(chart);
    } else {
        console.error(`[ChartJS] Failed to create zone chart for ${title}`);
    }

    try {
        addChartHoverEffects(container, themeConfig);
    } catch (error) {
        console.warn("[ChartJS] Unable to enhance zone chart hover effects", error);
    }
}

/**
 * Creates bar chart configuration
 */
/**
 * @param {import("../../types/sharedChartTypes.d.ts").ZoneData[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {{ showLegend?: boolean }} _options
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
/**
 * @param {any[]} zoneData
 * @param {any[]} colors
 * @param {string} title
 * @param {{ showLegend?: boolean }} _options
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
function createBarChartConfig(zoneData, colors, title, _options, currentTheme, baseDataset, chartId) {
    const legendEmoji = getZoneChartEmoji(chartId);
    const datasetLabel = legendEmoji ? `${legendEmoji} Time in Zone` : "Time in Zone";
    return {
        data: {
            datasets: [
                {
                    ...baseDataset,
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const b = Number.parseInt(color.slice(5, 7), 16),
                            g = Number.parseInt(color.slice(3, 5), 16),
                            r = Number.parseInt(color.slice(1, 3), 16);
                        return `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, 0.9)`;
                    }),
                    hoverBorderColor: colors.slice(0, zoneData.length),
                    hoverBorderWidth: 2,
                    label: datasetLabel,
                },
            ],
            labels: zoneData.map((zone) => zone.label || `Zone ${zone.zone || 1}`),
        },
        options: {
            animation: {
                duration: 1500,
                easing: "easeOutQuart",
            },
            interaction: {
                intersect: false,
                mode: "index",
            },
            maintainAspectRatio: true,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
                legend: {
                    display: false, // Single dataset, no need for legend
                },
                title: {
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    display: true,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    padding: 20,
                    text: title,
                },
                tooltip: {
                    backgroundColor: currentTheme === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor: currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    callbacks: {
                        /** @param {any} context */
                        label(context) {
                            const value = context.parsed.y,
                                timeFormatted = formatTime(value, true);
                            return `Time: ${timeFormatted}`;
                        },
                        /** @param {any} context */
                        labelColor(context) {
                            return {
                                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                                borderColor: context.dataset.borderColor,
                                borderRadius: 2,
                                borderWidth: 2,
                            };
                        },
                    },
                    cornerRadius: 8,
                    displayColors: true,
                    enabled: true,
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                },
            },
            responsive: true,
            scales: {
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
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                        text: "Zone",
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        lineWidth: 1,
                    },
                    ticks: {
                        /** @param {any} value */
                        callback(value) {
                            return formatTime(value, true);
                        },
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 12,
                        },
                    },
                    title: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                        text: "Time",
                    },
                },
            },
        },
        plugins: [chartBackgroundColorPlugin],
        type: "bar",
    };
}

/**
 * Creates chart configuration based on chart type
 * @param {string} chartType - "doughnut" or "bar"
 * @param {any[]} zoneData - Zone data array
 * @param {any[]} colors - Colors array
 * @param {string} title - Chart title
 * @param {Object} options - Chart options
 * @param {string} currentTheme - Current theme
 * @returns {Object} Chart.js configuration object
 */
/**
 * @param {string} chartType
 * @param {import("../../types/sharedChartTypes.d.ts").ZoneData[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {{ showLegend?: boolean }} options
 * @param {string} currentTheme
 */
function createChartConfig(chartType, zoneData, colors, title, options, currentTheme, chartId) {
    const baseDataset = {
        backgroundColor: colors.slice(0, zoneData.length),
        borderColor: currentTheme === "dark" ? "#333" : "#fff",
        borderWidth: chartType === "doughnut" ? 3 : 1,
        data: zoneData.map((zone) => zone.time || 0),
    };

    if (chartType === "bar") {
        return createBarChartConfig(zoneData, colors, title, options, currentTheme, baseDataset, chartId);
    }
    return createDoughnutChartConfig(zoneData, colors, title, options, currentTheme, baseDataset, chartId);
}

/**
 * Creates doughnut chart configuration
 */
/**
 * @param {import("../../types/sharedChartTypes.d.ts").ZoneData[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {{ showLegend?: boolean }} options
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
function createDoughnutChartConfig(zoneData, colors, title, options, currentTheme, baseDataset, chartId) {
    const legendEmoji = getZoneChartEmoji(chartId);
    const datasetLabel = legendEmoji ? `${legendEmoji} Time in Zone` : "Time in Zone";
    return {
        data: {
            datasets: [
                {
                    ...baseDataset,
                    borderAlign: "center",
                    borderJoinStyle: "round",
                    borderRadius: 4,
                    circumference: 360, // Full circle
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const b = Number.parseInt(color.slice(5, 7), 16),
                            g = Number.parseInt(color.slice(3, 5), 16),
                            r = Number.parseInt(color.slice(1, 3), 16);
                        return `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9)`;
                    }),
                    hoverBorderColor: "#ffffff",
                    hoverBorderWidth: 4,
                    hoverOffset: 8,
                    offset: 2,
                    rotation: -90, // Start from top
                    spacing: 2,
                    weight: 1,
                    label: datasetLabel,
                },
            ],
            labels: zoneData.map((zone) => zone.label || `Zone ${zone.zone || 1}`),
        },
        options: {
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: "easeOutQuart",
            },
            elements: {
                arc: {
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                },
            },
            interaction: {
                intersect: false,
                mode: "point",
            },
            maintainAspectRatio: true,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
                legend: {
                    display: options.showLegend !== false,
                    labels: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "600",
                        },
                        /** @param {any} chartInstance */
                        generateLabels(chartInstance) {
                            const { data } = chartInstance; // Fallbacks for defensive programming
                            if (!data || !Array.isArray(data.labels) || data.labels.length === 0) {
                                return [];
                            }
                            if (!Array.isArray(data.datasets) || data.datasets.length === 0) {
                                return [];
                            }

                            const [dataset] = data.datasets,
                                total = Array.isArray(dataset.data)
                                    ? dataset.data.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0)
                                    : 0;

                            return data.labels.map((/** @type {string} */ label, /** @type {number} */ i) => {
                                const meta = chartInstance.getDatasetMeta?.(0),
                                    isVisible = chartInstance.getDataVisibility?.(i);
                                const isHidden = isVisible === false;
                                const value = Array.isArray(dataset.data) ? dataset.data[i] : 0;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                                const decoratedLabel = legendEmoji ? `${legendEmoji} ${label}` : label;
                                const fillColor = Array.isArray(dataset.backgroundColor)
                                    ? dataset.backgroundColor[i]
                                    : dataset.backgroundColor;

                                return {
                                    fillStyle: isHidden ? "rgba(128, 128, 128, 0.5)" : fillColor,
                                    fontColor: isHidden
                                        ? "rgba(128, 128, 128, 0.7)"
                                        : currentTheme === "dark"
                                            ? "#ffffff"
                                            : "#333333",
                                    hidden: Boolean(isHidden || meta?.data?.[i]?.hidden),
                                    index: i,
                                    lineWidth: 1,
                                    pointStyle: "circle",
                                    strokeStyle: isHidden ? "rgba(128, 128, 128, 0.5)" : fillColor,
                                    text: `${decoratedLabel}: ${formatTime(value, true)} (${percentage}%)`,
                                };
                            });
                        },
                        padding: 20,
                        pointStyle: "circle",
                        usePointStyle: true,
                    },
                    /**
                     * @param {any} _event
                     * @param {any} legendItem
                     * @param {any} legend
                     */
                    onClick(_event, legendItem, legend) {
                        const { chart } = legend || {};
                        if (!chart || typeof legendItem?.index !== "number") {
                            return;
                        }
                        chart.toggleDataVisibility(legendItem.index);
                        chart.update();
                    },
                    position: "right",
                },
                title: {
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    display: true,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    padding: 20,
                    text: title,
                },
                tooltip: {
                    backgroundColor: currentTheme === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor: currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    callbacks: {
                        /** @param {any} context */
                        label(context) {
                            const total = context.dataset.data.reduce(
                                (/** @type {number} */ a, /** @type {number} */ b) => a + b,
                                0
                            ),
                                value = context.parsed,
                                percentage = ((value / total) * 100).toFixed(1),
                                timeFormatted = formatTime(context.parsed, true);
                            return [`Time: ${timeFormatted}`, `Percentage: ${percentage}%`];
                        },
                        /** @param {any} context */
                        labelColor(context) {
                            return {
                                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                                borderColor: context.dataset.borderColor,
                                borderRadius: 2,
                                borderWidth: 2,
                            };
                        },
                    },
                    cornerRadius: 8,
                    displayColors: true,
                    enabled: true,
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                },
            },
            // Creates a nice donut hole
            radius: "90%",
            responsive: true,
        },
        plugins: [chartBackgroundColorPlugin],
        type: "doughnut",
    };
}

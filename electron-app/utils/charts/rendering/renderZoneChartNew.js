import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { getChartZoneColors, getZoneTypeFromField } from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { getChartIcon, getZoneChartEmoji, getZoneChartIcon } from "../../ui/icons/iconMappings.js";
import { attachChartLabelMetadata } from "../components/attachChartLabelMetadata.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";

/**
 * @typedef {Object} ZoneDataItem
 * @property {number} [zone]
 * @property {string} [label]
 * @property {number} [time]
 * @property {string} [color]
 */

/**
 * @typedef {Object} RenderZoneChartOptions
 * @property {string} [chartType] - "doughnut" | "bar"
 * @property {boolean} [showLegend]
 */

// Helper function to render individual zone chart
/**
 * @param {HTMLElement} container
 * @param {string} title
 * @param {ZoneDataItem[]} zoneData
 * @param {string} chartId
 * @param {RenderZoneChartOptions} [options]
 */
export function renderZoneChart(container, title, zoneData, chartId, options = {}) {
    try {
        if (!(container instanceof HTMLElement)) {
            return;
        }
        if (!Array.isArray(zoneData) || zoneData.length === 0) {
            return;
        }

        console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);

        /** @type {any} */
        const // Second arg expects numeric index; provide 0 as default order
            canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas(chartId, 0)),
            // Determine chart type from options or default to doughnut
            chartType = options && options.chartType ? options.chartType : "doughnut",
            currentTheme = detectCurrentTheme(),
            themeConfig = getThemeConfig();

        // Apply theme-aware canvas styling (background handled by plugin)
        if (themeConfig?.colors) {
            canvas.style.borderRadius = "12px";
            canvas.style.boxShadow = themeConfig.colors.shadowLight
                ? `0 2px 16px 0 ${themeConfig.colors.shadowLight}`
                : "";
        }

        container.append(canvas);

        // Determine zone type and get user-selected colors from theme
        /** @type {string[]} */
        let colors = Array.isArray(themeConfig?.colors?.zoneColors) ? themeConfig.colors.zoneColors : [];

        // Check if zone data has color properties (from applyZoneColors), otherwise use saved colors
        if (zoneData.length > 0 && typeof zoneData[0]?.color === "string") {
            colors = zoneData.map((z) => z.color || "#888888");
        } else {
            // Fall back to getting saved colors by zone type
            const zoneType = getZoneTypeFromField(chartId);
            if (zoneType) {
                colors = getChartZoneColors(zoneType, zoneData.length) || colors;
            }
        }

        // Create chart configuration based on type
        const primaryColor = Array.isArray(colors) && colors.length > 0 ? colors[0] : themeConfig?.colors?.primary,
            yLabel = `Time (${getUnitSymbol("time", "time")})`;

        attachChartLabelMetadata(canvas, {
            titleIcon: getZoneChartIcon(chartId) || getChartIcon(chartId),
            titleText: title,
            titleColor: primaryColor,
            xIcon: getZoneChartIcon(chartId) || getChartIcon(chartId),
            xText: "Zone",
            yIcon: getChartIcon("time"),
            yText: yLabel,
        });

        const config = createChartConfig(chartType, zoneData, colors, title, options, currentTheme, chartId);

        console.log(`[ChartJS] Creating ${chartType} zone chart with config:`, config);
        const chart = new globalThis.Chart(canvas, config);
        if (chart) {
            if (!globalThis._chartjsInstances) {
                globalThis._chartjsInstances = [];
            }
            globalThis._chartjsInstances.push(chart);
            console.log(`[ChartJS] Zone chart created successfully for ${title}`);
        }
    } catch (error) {
        console.error("[ChartJS] Failed to create zone chart", error);
    }
}

/**
 * Creates bar chart configuration
 */
/**
 * @param {ZoneDataItem[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
function createBarChartConfig(
    zoneData,
    colors,
    title,
    /** @type {RenderZoneChartOptions|undefined} */ _options,
    currentTheme,
    baseDataset,
    chartId
) {
    const legendEmoji = getZoneChartEmoji(chartId);
    const datasetLabel = legendEmoji ? `${legendEmoji} Time in Zone` : "Time in Zone";
    // _options kept for parity
    return {
        data: {
            datasets: [
                {
                    ...baseDataset,
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        const safe = /^#?[\dA-Fa-f]{6}$/.test(color) ? color.replace("#", "") : "999999",
                            b = Number.parseInt(safe.slice(4, 6), 16),
                            g = Number.parseInt(safe.slice(2, 4), 16),
                            r = Number.parseInt(safe.slice(0, 2), 16);
                        return `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, 0.9)`;
                    }),
                    hoverBorderColor: colors.slice(0, zoneData.length),
                    hoverBorderWidth: 2,
                    label: datasetLabel,
                },
            ],
            labels: zoneData.map((zone, i) => zone.label || `Zone ${zone.zone || i + 1}`),
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
                    color: "rgba(0,0,0,0)",
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
                        label(/** @type {any} */ context) {
                            const value = context?.parsed?.y || 0,
                                timeFormatted = formatTime(value, true);
                            return `Time: ${timeFormatted}`;
                        },
                        labelColor(/** @type {any} */ context) {
                            return {
                                backgroundColor:
                                    context?.dataset?.backgroundColor?.[context?.dataIndex] ||
                                    context?.dataset?.borderColor,
                                borderColor: context?.dataset?.borderColor,
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
                        color: "rgba(0,0,0,0)",
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
                        callback(/** @type {number} */ value) {
                            return formatTime(typeof value === "number" ? value : 0, true);
                        },
                        color: "rgba(0,0,0,0)",
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
                        text: `Time (${getUnitSymbol("time", "time")})`,
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
 * @param {ZoneDataItem[]} zoneData - Zone data array
 * @param {string[]} colors - Colors array
 * @param {string} title - Chart title
 * @param {Object} options - Chart options
 * @param {string} currentTheme - Current theme
 * @returns {Object} Chart.js configuration object
 */
/**
 * @param {string} chartType
 * @param {ZoneDataItem[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {string} currentTheme
 */
function createChartConfig(
    chartType,
    zoneData,
    colors,
    title,
    /** @type {RenderZoneChartOptions} */ options,
    currentTheme,
    chartId
) {
    const baseDataset = {
        backgroundColor: colors.slice(0, zoneData.length),
        borderColor: currentTheme === "dark" ? "#333" : "#fff",
        borderWidth: chartType === "doughnut" ? 3 : 1,
        data: zoneData.map((zone) => (typeof zone.time === "number" ? zone.time : 0)),
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
 * @param {ZoneDataItem[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {RenderZoneChartOptions} options
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
                        const safe = /^#?[\dA-Fa-f]{6}$/.test(color) ? color.replace("#", "") : "999999",
                            b = Number.parseInt(safe.slice(4, 6), 16),
                            g = Number.parseInt(safe.slice(2, 4), 16),
                            r = Number.parseInt(safe.slice(0, 2), 16);
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
            labels: zoneData.map((zone, i) => zone.label || `Zone ${zone.zone || i + 1}`),
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
                        generateLabels(/** @type {any} */ chart) {
                            const data = chart?.data;
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
                                const fillSource = Array.isArray(dataset.backgroundColor)
                                    ? dataset.backgroundColor[i]
                                    : dataset.backgroundColor,
                                    isHidden = chart?.getDataVisibility?.(i) === false,
                                    value = Array.isArray(dataset.data) ? dataset.data[i] : 0,
                                    percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0",
                                    decoratedLabel = legendEmoji ? `${legendEmoji} ${label}` : label;

                                return {
                                    fillStyle: isHidden ? "rgba(128, 128, 128, 0.5)" : fillSource,
                                    hidden: Boolean(isHidden || chart?.getDatasetMeta?.(0)?.data?.[i]?.hidden),
                                    index: i,
                                    lineWidth: 1,
                                    pointStyle: "circle",
                                    strokeStyle: isHidden ? "rgba(128, 128, 128, 0.5)" : fillSource,
                                    text: `${decoratedLabel}: ${formatTime(value, true)} (${percentage}%)`,
                                };
                            });
                        },
                        padding: 20,
                        pointStyle: "circle",
                        usePointStyle: true,
                    },
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
                    color: "rgba(0,0,0,0)",
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
                        label(/** @type {any} */ context) {
                            const datasetData = Array.isArray(context?.dataset?.data) ? context.dataset.data : [],
                                total = datasetData.reduce(
                                    (/** @type {number} */ a, /** @type {number} */ b) => a + b,
                                    0
                                ),
                                value = context?.parsed,
                                percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0",
                                timeFormatted = formatTime(
                                    typeof context?.parsed === "number" ? context.parsed : 0,
                                    true
                                );
                            return [`Time: ${timeFormatted}`, `Percentage: ${percentage}%`];
                        },
                        labelColor(/** @type {any} */ context) {
                            return {
                                backgroundColor:
                                    context?.dataset?.backgroundColor?.[context?.dataIndex] ||
                                    context?.dataset?.borderColor,
                                borderColor: context?.dataset?.borderColor,
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

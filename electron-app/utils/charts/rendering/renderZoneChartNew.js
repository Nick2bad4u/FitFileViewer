import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getZoneTypeFromField, getChartZoneColors } from "../../data/zones/chartZoneColorUtils.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";

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
        if (!(container instanceof HTMLElement)) return;
        if (!Array.isArray(zoneData) || zoneData.length === 0) return;

        console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);

        /** @type {any} */
        const themeConfig = getThemeConfig();
        const currentTheme = detectCurrentTheme();

        // Determine chart type from options or default to doughnut
        const chartType = options && options.chartType ? options.chartType : "doughnut";

    // Second arg expects numeric index; provide 0 as default order
    const canvas = /** @type {HTMLCanvasElement} */ (createChartCanvas(chartId, 0));

        // Apply theme-aware canvas styling (background handled by plugin)
        if (themeConfig?.colors) {
            canvas.style.borderRadius = "12px";
            canvas.style.boxShadow = themeConfig.colors.shadowLight ? `0 2px 16px 0 ${themeConfig.colors.shadowLight}` : "";
        }

        container.appendChild(canvas);

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
        const config = createChartConfig(chartType, zoneData, colors, title, options, currentTheme);

        console.log(`[ChartJS] Creating ${chartType} zone chart with config:`, config);
        const chart = new window.Chart(canvas, config);
        if (chart) {
            if (!window._chartjsInstances) window._chartjsInstances = [];
            window._chartjsInstances.push(chart);
            console.log(`[ChartJS] Zone chart created successfully for ${title}`);
        }
    } catch (error) {
        console.error("[ChartJS] Failed to create zone chart", error);
    }
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
function createChartConfig(chartType, zoneData, colors, title, /** @type {RenderZoneChartOptions} */ options, currentTheme) {
    const baseDataset = {
    data: zoneData.map((zone) => (typeof zone.time === "number" ? zone.time : 0)),
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
/**
 * @param {ZoneDataItem[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {RenderZoneChartOptions} options
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
function createDoughnutChartConfig(zoneData, colors, title, options, currentTheme, baseDataset) {
    return {
        type: "doughnut",
        data: {
            labels: zoneData.map((zone, i) => zone.label || `Zone ${zone.zone || i + 1}`),
            datasets: [
                {
                    ...baseDataset,
                    borderAlign: "center",
                    borderRadius: 4,
                    borderJoinStyle: "round",
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const safe = /^#?[0-9a-fA-F]{6}$/.test(color) ? color.replace('#','') : '999999';
                        const r = parseInt(safe.slice(0, 2), 16);
                        const g = parseInt(safe.slice(2, 4), 16);
                        const b = parseInt(safe.slice(4, 6), 16);
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
                    labels: {
                        display: true,
                        font: {
                            size: 14,
                            weight: "600",
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: "circle",
                        generateLabels: function (/** @type {any} */ chart) {
                            const data = chart?.data || { labels: [], datasets: [] };
                            if (Array.isArray(data.labels) && data.labels.length && Array.isArray(data.datasets) && data.datasets.length) {
                                const dataset = data.datasets[0];
                                const total = Array.isArray(dataset.data) ? dataset.data.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0) : 0;
                                return data.labels.map((/** @type {string} */ label, /** @type {number} */ i) => {
                                    const value = Array.isArray(dataset.data) ? dataset.data[i] : 0;
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                                    const meta = chart.getDatasetMeta ? chart.getDatasetMeta(0) : { data: [] };
                                    const hidden = meta?.data?.[i]?.hidden;
                                    return {
                                        text: `${label}: ${formatTime(value, true)} (${percentage}%)`,
                                        fillStyle: hidden ? "rgba(128, 128, 128, 0.5)" : dataset.backgroundColor?.[i],
                                        strokeStyle: hidden ? "rgba(128, 128, 128, 0.5)" : dataset.borderColor,
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
                        label: function (/** @type {any} */ context) {
                            const value = context?.parsed;
                            const datasetData = Array.isArray(context?.dataset?.data) ? context.dataset.data : [];
                            const total = datasetData.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                            const timeFormatted = formatTime(typeof context?.parsed === "number" ? context.parsed : 0, true);
                            return [`Time: ${timeFormatted}`, `Percentage: ${percentage}%`];
                        },
                        labelColor: function (/** @type {any} */ context) {
                            return {
                                borderColor: context?.dataset?.borderColor,
                                backgroundColor: context?.dataset?.backgroundColor?.[context?.dataIndex] || context?.dataset?.borderColor,
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
/**
 * @param {ZoneDataItem[]} zoneData
 * @param {string[]} colors
 * @param {string} title
 * @param {string} currentTheme
 * @param {any} baseDataset
 */
function createBarChartConfig(zoneData, colors, title, /** @type {RenderZoneChartOptions|undefined} */ _options, currentTheme, baseDataset) { // _options kept for parity
    return {
        type: "bar",
        data: {
            labels: zoneData.map((zone, i) => zone.label || `Zone ${zone.zone || i + 1}`),
            datasets: [
                {
                    ...baseDataset,
                    label: "Time in Zone",
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        const safe = /^#?[0-9a-fA-F]{6}$/.test(color) ? color.replace('#','') : '999999';
                        const r = parseInt(safe.slice(0, 2), 16);
                        const g = parseInt(safe.slice(2, 4), 16);
                        const b = parseInt(safe.slice(4, 6), 16);
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
                        label: function (/** @type {any} */ context) {
                            const value = context?.parsed?.y || 0;
                            const timeFormatted = formatTime(value, true);
                            return `Time: ${timeFormatted}`;
                        },
                        labelColor: function (/** @type {any} */ context) {
                            return {
                                borderColor: context?.dataset?.borderColor,
                                backgroundColor: context?.dataset?.backgroundColor?.[context?.dataIndex] || context?.dataset?.borderColor,
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
                        callback: function (/** @type {number} */ value) {
                            return formatTime(typeof value === "number" ? value : 0, true);
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

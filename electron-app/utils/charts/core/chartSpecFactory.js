/**
 * @typedef {Object} ChartDatasetSpec
 * @property {string} id - Identifier for the dataset
 * @property {string} label - Label for legend/tooltips
 * @property {any[]} data - Data points for the dataset
 * @property {string} [colorRole] - Optional theme color role (e.g. "primary", "success")
 * @property {string} [borderColor] - Explicit border color (overrides colorRole)
 * @property {string} [backgroundColor] - Explicit background color (overrides colorRole)
 * @property {boolean} [fill] - Whether to fill area under line
 * @property {boolean} [showLine] - Whether to draw line (for scatter charts)
 * @property {number} [pointRadius] - Point radius
 * @property {number} [pointHoverRadius] - Point hover radius
 * @property {number} [tension] - Line tension
 * @property {string} [yAxisID] - Y-axis ID for multi-axis charts
 */

/**
 * @typedef {Object} ChartAxisSpec
 * @property {string} id - Axis ID (e.g. "x", "y", "y1")
 * @property {"linear"|"category"|"logarithmic"} type - Axis type
 * @property {string} [position] - Position (e.g. "left", "right")
 * @property {string} [label] - Axis label text
 * @property {boolean} [display] - Whether to display the axis
 */

/**
 * @typedef {Object} ChartPluginSpec
 * @property {boolean} [useZoomReset] - Whether to include zoom reset plugin
 * @property {boolean} [useBackground] - Whether to include chart background plugin
 */

/**
 * @typedef {Object} ChartSpec
 * @property {"line"|"bar"|"scatter"|"doughnut"} type - Chart type
 * @property {ChartDatasetSpec[]} datasets - Dataset specifications
 * @property {ChartAxisSpec[]} [axes] - Axis specifications
 * @property {ChartPluginSpec} [plugins] - Plugin configuration
 * @property {string} [title] - Chart title
 * @property {boolean} [showLegend] - Whether to show legend
 * @property {boolean} [showGrid] - Whether to show grid lines
 */

/**
 * Build a Chart.js configuration object from a declarative spec and theme config.
 *
 * This helper is intentionally minimal and focuses on the common configuration
 * shared by FitFileViewer charts. It is primarily used in tests and as a
 * foundation for future declarative chart definitions.
 *
 * @param {ChartSpec} spec - Declarative chart specification
 * @param {any} themeConfig - Theme configuration (colors etc.)
 * @returns {any} Chart.js configuration object
 */
export function buildChartConfigFromSpec(spec, themeConfig) {
    const colors = themeConfig?.colors || {};

    const datasets = spec.datasets.map((dataset) => {
        const baseColor =
            dataset.borderColor ||
            dataset.backgroundColor ||
            (dataset.colorRole && colors[dataset.colorRole]) ||
            colors.primary ||
            "#007bff";

        return {
            backgroundColor: dataset.backgroundColor || `${baseColor}33`,
            borderColor: dataset.borderColor || baseColor,
            data: dataset.data,
            fill: dataset.fill ?? false,
            label: dataset.label,
            pointHoverRadius: dataset.pointHoverRadius ?? 4,
            pointRadius: dataset.pointRadius ?? 2,
            showLine: dataset.showLine ?? (spec.type === "scatter" ? false : true),
            tension: dataset.tension ?? 0.1,
            yAxisID: dataset.yAxisID || "y",
        };
    });

    /** @type {Record<string, any>} */
    const scales = {};
    if (Array.isArray(spec.axes)) {
        for (const axis of spec.axes) {
            const isX = axis.id === "x";
            scales[axis.id] = {
                display: axis.display !== false,
                grid: {
                    color: colors.gridLines || "#e9ecef",
                    display: spec.showGrid !== false,
                },
                position: isX ? undefined : axis.position || (axis.id === "y1" ? "right" : "left"),
                ticks: {
                    color: colors.textPrimary || "#000000",
                },
                title: {
                    color: colors.textPrimary || "#000000",
                    display: Boolean(axis.label),
                    text: axis.label || "",
                },
                type: axis.type,
            };
        }
    }

    const options = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: spec.showLegend !== false,
                labels: { color: colors.text || "#000000" },
            },
            title: {
                color: colors.text || "#000000",
                display: Boolean(spec.title),
                font: { size: 16, weight: "bold" },
                text: spec.title || "",
            },
        },
        responsive: true,
        scales,
    };

    return {
        data: { datasets },
        options,
        type: spec.type,
    };
}

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
 * @property {boolean} [hidden] - Whether to hide the dataset in the chart
 * @property {string} [yAxisID] - Y-axis ID for multi-axis charts
 */

/**
 * @typedef {Object} ChartDatasetDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} [dataKey]
 * @property {(record: Record<string, unknown>, index: number) => number | null} [valueSelector]
 * @property {(value: number | null, record: Record<string, unknown>, index: number) => number | null} [transform]
 * @property {string} [color]
 * @property {string} [yAxisId]
 * @property {boolean} [hidden]
 * @property {Record<string, unknown>} [datasetOptions]
 */

/**
 * @typedef {Object} ChartDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} chartType
 * @property {ChartDatasetDefinition[]} datasets
 * @property {(record: Record<string, unknown>, index: number) => string | number} [labelSelector]
 * @property {string} [xAxisLabel]
 * @property {string} [yAxisLabel]
 */

/**
 * @typedef {Object} ChartDefinitionOptions
 * @property {Record<string, unknown>} [chartSettings]
 * @property {string[]} [defaultColorPalette]
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
            hidden: dataset.hidden ?? false,
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

/**
 * Build a chart specification from a declarative definition and raw record data.
 *
 * @param {ChartDefinition} definition
 * @param {Array<Record<string, unknown>>} records
 * @param {ChartDefinitionOptions} [options]
 * @returns {ChartSpec}
 */
export function buildChartSpecFromDefinition(definition, records, options = {}) {
    const { chartSettings = {}, defaultColorPalette = [] } = options;
    const fieldVisibility =
        typeof chartSettings === "object" && chartSettings !== null ? chartSettings.fieldVisibility || {} : {};

    const labels = definition.labelSelector
        ? records.map((record, index) => definition.labelSelector(record, index))
        : records.map((_, index) => index);

    const datasets = definition.datasets.map((dataset, datasetIndex) => {
        const color = dataset.color || defaultColorPalette[datasetIndex];
        const data = records.map((record, recordIndex) => {
            const rawValue = dataset.valueSelector
                ? dataset.valueSelector(record, recordIndex)
                : dataset.dataKey
                ? /** @type {number | null} */ (record?.[dataset.dataKey])
                : null;

            return dataset.transform ? dataset.transform(rawValue, record, recordIndex) : rawValue;
        });

        const visibilityOverride = fieldVisibility?.[dataset.id];
        const isHidden = visibilityOverride === "hidden" || dataset.hidden === true;

        return {
            id: dataset.id,
            label: dataset.label,
            data,
            backgroundColor: color,
            borderColor: color,
            yAxisID: dataset.yAxisId,
            hidden: isHidden,
            ...(dataset.datasetOptions || {}),
        };
    });

    return createChartSpec({
        id: definition.id,
        title: definition.title,
        chartType: definition.chartType,
        labels,
        datasets,
        axes: {
            x: definition.xAxisLabel
                ? {
                      label: definition.xAxisLabel,
                  }
                : undefined,
            y: definition.yAxisLabel
                ? {
                      label: definition.yAxisLabel,
                  }
                : undefined,
        },
    });
}

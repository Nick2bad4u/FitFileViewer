function getRecordValue(record, key) {
    const value = record[key];
    return typeof value === "number" || value === null ? value : null;
}
function getFieldVisibility(chartSettings) {
    const fieldVisibility = chartSettings["fieldVisibility"];
    return fieldVisibility && typeof fieldVisibility === "object"
        ? fieldVisibility
        : {};
}
/**
 * Build a Chart.js configuration object from a declarative spec and theme
 * config.
 *
 * @param spec - Declarative chart specification.
 * @param themeConfig - Theme configuration.
 * @returns Chart.js configuration object.
 */
export function buildChartConfigFromSpec(spec, themeConfig) {
    const colors = themeConfig?.colors ?? {};
    const datasets = spec.datasets.map((dataset) => {
        const baseColor = dataset.borderColor ??
            dataset.backgroundColor ??
            (dataset.colorRole ? colors[dataset.colorRole] : undefined) ??
            colors["primary"] ??
            "#007bff";
        return {
            backgroundColor: dataset.backgroundColor ?? `${baseColor}33`,
            borderColor: dataset.borderColor ?? baseColor,
            data: dataset.data,
            fill: dataset.fill ?? false,
            hidden: dataset.hidden ?? false,
            label: dataset.label,
            pointHoverRadius: dataset.pointHoverRadius ?? 4,
            pointRadius: dataset.pointRadius ?? 2,
            showLine: dataset.showLine ?? spec.type !== "scatter",
            tension: dataset.tension ?? 0.1,
            yAxisID: dataset.yAxisID ?? "y",
        };
    });
    const scales = {};
    if (Array.isArray(spec.axes)) {
        for (const axis of spec.axes) {
            const isX = axis.id === "x";
            scales[axis.id] = {
                display: axis.display !== false,
                grid: {
                    color: colors["gridLines"] ?? "#e9ecef",
                    display: spec.showGrid !== false,
                },
                position: isX
                    ? undefined
                    : (axis.position ?? (axis.id === "y1" ? "right" : "left")),
                ticks: {
                    color: colors["textPrimary"] ?? "#000000",
                },
                title: {
                    color: colors["textPrimary"] ?? "#000000",
                    display: Boolean(axis.label),
                    text: axis.label ?? "",
                },
                type: axis.type,
            };
        }
    }
    return {
        data: { datasets },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: spec.showLegend !== false,
                    labels: { color: colors["text"] ?? "#000000" },
                },
                title: {
                    color: colors["text"] ?? "#000000",
                    display: Boolean(spec.title),
                    font: { size: 16, weight: "bold" },
                    text: spec.title ?? "",
                },
            },
            responsive: true,
            scales,
        },
        type: spec.type,
    };
}
/**
 * Build a chart specification from a declarative definition and raw record data.
 *
 * @param definition - Declarative chart definition.
 * @param records - Raw record rows.
 * @param options - Optional settings and default palette.
 * @returns Chart specification.
 */
export function buildChartSpecFromDefinition(definition, records, options = {}) {
    const { chartSettings = {}, defaultColorPalette = [] } = options, fieldVisibility = getFieldVisibility(chartSettings);
    const labels = definition.labelSelector
        ? records.map((record, index) => definition.labelSelector?.(record, index) ?? index)
        : records.map((_, index) => index);
    const datasets = definition.datasets.map((dataset, datasetIndex) => {
        const color = dataset.color ?? defaultColorPalette[datasetIndex], data = records.map((record, recordIndex) => {
            const rawValue = dataset.valueSelector
                ? dataset.valueSelector(record, recordIndex)
                : dataset.dataKey
                    ? getRecordValue(record, dataset.dataKey)
                    : null;
            return dataset.transform
                ? dataset.transform(rawValue, record, recordIndex)
                : rawValue;
        });
        const visibilityOverride = fieldVisibility[dataset.id], isHidden = visibilityOverride === "hidden" || dataset.hidden === true;
        const chartDataset = {
            ...dataset.datasetOptions,
            data,
            hidden: isHidden,
            id: dataset.id,
            label: dataset.label,
        };
        if (color !== undefined) {
            return {
                ...chartDataset,
                backgroundColor: color,
                borderColor: color,
                ...(dataset.yAxisId === undefined
                    ? {}
                    : { yAxisID: dataset.yAxisId }),
            };
        }
        return dataset.yAxisId === undefined
            ? chartDataset
            : { ...chartDataset, yAxisID: dataset.yAxisId };
    });
    const axes = {};
    if (definition.xAxisLabel) {
        axes.x = {
            label: definition.xAxisLabel,
        };
    }
    if (definition.yAxisLabel) {
        axes.y = {
            label: definition.yAxisLabel,
        };
    }
    return createChartSpec({
        axes,
        chartType: definition.chartType,
        datasets,
        id: definition.id,
        labels,
        title: definition.title,
    });
}
function createChartSpec(input) {
    const labels = input.labels, labelIsNumeric = labels.length > 0 &&
        labels.every((label) => typeof label === "number"), chartType = input.chartType === "area" ? "line" : input.chartType, axes = [];
    if (input.axes?.x?.label) {
        axes.push({
            display: true,
            id: "x",
            label: input.axes.x.label,
            type: labelIsNumeric ? "linear" : "category",
        });
    }
    if (input.axes?.y?.label) {
        axes.push({
            display: true,
            id: "y",
            label: input.axes.y.label,
            type: "linear",
        });
    }
    const spec = {
        datasets: input.datasets,
        id: input.id,
        labels,
        type: chartType,
    };
    if (axes.length > 0) {
        spec.axes = axes;
    }
    if (input.title !== undefined) {
        spec.title = input.title;
    }
    return spec;
}

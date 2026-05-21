import { isObjectRecord } from "./renderChartModuleHelpers.js";

/**
 * Dataset payload used by declarative chart specs.
 */
export type ChartDatasetSpec = {
    readonly backgroundColor?: string;
    readonly borderColor?: string;
    readonly colorRole?: string;
    readonly data: readonly unknown[];
    readonly fill?: boolean;
    readonly hidden?: boolean;
    readonly id: string;
    readonly label: string;
    readonly pointHoverRadius?: number;
    readonly pointRadius?: number;
    readonly showLine?: boolean;
    readonly tension?: number;
    readonly yAxisID?: string;
};

/**
 * Definition for deriving one chart dataset from raw record rows.
 */
export type ChartDatasetDefinition = {
    readonly color?: string;
    readonly dataKey?: string;
    readonly datasetOptions?: Record<string, unknown>;
    readonly hidden?: boolean;
    readonly id: string;
    readonly label: string;
    readonly transform?: (
        value: number | null,
        record: Record<string, unknown>,
        index: number
    ) => number | null;
    readonly valueSelector?: (
        record: Record<string, unknown>,
        index: number
    ) => number | null;
    readonly yAxisId?: string;
};

/**
 * Declarative chart definition used to derive a chart spec from record rows.
 */
export type ChartDefinition = {
    readonly chartType: string;
    readonly datasets: readonly ChartDatasetDefinition[];
    readonly id: string;
    readonly labelSelector?: (
        record: Record<string, unknown>,
        index: number
    ) => string | number;
    readonly title: string;
    readonly xAxisLabel?: string;
    readonly yAxisLabel?: string;
};

/**
 * Optional settings used when building a chart spec from a definition.
 */
export type ChartDefinitionOptions = {
    readonly chartSettings?: Record<string, unknown>;
    readonly defaultColorPalette?: readonly string[];
};

/**
 * Axis configuration in a declarative chart spec.
 */
export type ChartAxisSpec = {
    readonly display?: boolean;
    readonly id: string;
    readonly label?: string;
    readonly position?: string;
    readonly type: "linear" | "category" | "logarithmic";
};

/**
 * Plugin toggles in a declarative chart spec.
 */
export type ChartPluginSpec = {
    readonly useBackground?: boolean;
    readonly useZoomReset?: boolean;
};

/**
 * Declarative chart specification consumed by the Chart.js config builder.
 */
export type ChartSpec = {
    readonly axes?: readonly ChartAxisSpec[];
    readonly datasets: readonly ChartDatasetSpec[];
    readonly id?: string;
    readonly labels?: readonly (string | number)[];
    readonly plugins?: ChartPluginSpec;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly title?: string;
    readonly type: string;
};

/**
 * Minimal Chart.js config shape produced by this factory.
 */
export type ChartConfigFromSpec = {
    readonly data: {
        readonly datasets: readonly Record<string, unknown>[];
    };
    readonly options: {
        readonly maintainAspectRatio: boolean;
        readonly plugins: Record<string, unknown>;
        readonly responsive: boolean;
        readonly scales: Record<string, unknown>;
    };
    readonly type: string;
};

type ThemeConfig = {
    readonly colors?: Record<string, string | undefined>;
};

type ChartSpecInput = {
    readonly axes?: {
        readonly x?: { readonly label?: string };
        readonly y?: { readonly label?: string };
    };
    readonly chartType: string;
    readonly datasets: readonly ChartDatasetSpec[];
    readonly id: string;
    readonly labels: readonly (string | number)[];
    readonly title?: string;
};

function getRecordValue(
    record: Record<string, unknown>,
    key: string
): number | null {
    const value = record[key];
    return typeof value === "number" || value === null ? value : null;
}

function getFieldVisibility(
    chartSettings: Record<string, unknown>
): Record<string, unknown> {
    const fieldVisibility = chartSettings["fieldVisibility"];
    return isObjectRecord(fieldVisibility) ? fieldVisibility : {};
}

/**
 * Build a Chart.js configuration object from a declarative spec and theme
 * config.
 *
 * @param spec - Declarative chart specification.
 * @param themeConfig - Theme configuration.
 *
 * @returns Chart.js configuration object.
 */
export function buildChartConfigFromSpec(
    spec: ChartSpec,
    themeConfig: ThemeConfig | null | undefined
): ChartConfigFromSpec {
    const colors = themeConfig?.colors ?? {};

    const datasets = spec.datasets.map((dataset) => {
        const baseColor =
            dataset.borderColor ??
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

    const scales: Record<string, unknown> = {};
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
 * Build a chart specification from a declarative definition and raw record
 * data.
 *
 * @param definition - Declarative chart definition.
 * @param records - Raw record rows.
 * @param options - Optional settings and default palette.
 *
 * @returns Chart specification.
 */
export function buildChartSpecFromDefinition(
    definition: ChartDefinition,
    records: readonly Record<string, unknown>[],
    options: ChartDefinitionOptions = {}
): ChartSpec {
    const { chartSettings = {}, defaultColorPalette = [] } = options,
        fieldVisibility = getFieldVisibility(chartSettings);

    const labels = definition.labelSelector
        ? records.map(
              (record, index) =>
                  definition.labelSelector?.(record, index) ?? index
          )
        : records.map((_, index) => index);

    const datasets = definition.datasets.map((dataset, datasetIndex) => {
        const color = dataset.color ?? defaultColorPalette[datasetIndex],
            data = records.map((record, recordIndex) => {
                const rawValue = dataset.valueSelector
                    ? dataset.valueSelector(record, recordIndex)
                    : dataset.dataKey
                      ? getRecordValue(record, dataset.dataKey)
                      : null;

                return dataset.transform
                    ? dataset.transform(rawValue, record, recordIndex)
                    : rawValue;
            });

        const visibilityOverride = fieldVisibility[dataset.id],
            isHidden =
                visibilityOverride === "hidden" || dataset.hidden === true;

        const chartDataset: ChartDatasetSpec = {
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

    const axes: {
        x?: { label?: string };
        y?: { label?: string };
    } = {};
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

function createChartSpec(input: ChartSpecInput): ChartSpec {
    const labels = input.labels,
        labelIsNumeric =
            labels.length > 0 &&
            labels.every((label) => typeof label === "number"),
        chartType = input.chartType === "area" ? "line" : input.chartType,
        axes: ChartAxisSpec[] = [];

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

    const spec: {
        axes?: ChartAxisSpec[];
        datasets: readonly ChartDatasetSpec[];
        id: string;
        labels: readonly (string | number)[];
        title?: string;
        type: string;
    } = {
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

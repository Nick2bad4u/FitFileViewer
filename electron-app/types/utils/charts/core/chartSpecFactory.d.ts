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
 * @property {boolean} [hidden] - Whether to hide the dataset
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
export function buildChartConfigFromSpec(spec: ChartSpec, themeConfig: any): any;
/**
 * Build a ChartSpec from a declarative definition and record data.
 *
 * @param {ChartDefinition} definition - Declarative chart definition
 * @param {Array<Record<string, unknown>>} records - Raw record data
 * @param {ChartDefinitionOptions} [options] - Optional settings injection
 * @returns {ChartSpec} Chart specification
 */
export function buildChartSpecFromDefinition(
    definition: ChartDefinition,
    records: Array<Record<string, unknown>>,
    options?: ChartDefinitionOptions
): ChartSpec;
export type ChartDatasetSpec = {
    /**
     * - Identifier for the dataset
     */
    id: string;
    /**
     * - Label for legend/tooltips
     */
    label: string;
    /**
     * - Data points for the dataset
     */
    data: any[];
    /**
     * - Optional theme color role (e.g. "primary", "success")
     */
    colorRole?: string;
    /**
     * - Explicit border color (overrides colorRole)
     */
    borderColor?: string;
    /**
     * - Explicit background color (overrides colorRole)
     */
    backgroundColor?: string;
    /**
     * - Whether to fill area under line
     */
    fill?: boolean;
    /**
     * - Whether to draw line (for scatter charts)
     */
    showLine?: boolean;
    /**
     * - Point radius
     */
    pointRadius?: number;
    /**
     * - Point hover radius
     */
    pointHoverRadius?: number;
    /**
     * - Line tension
     */
    tension?: number;
    /**
     * - Whether to hide the dataset
     */
    hidden?: boolean;
    /**
     * - Y-axis ID for multi-axis charts
     */
    yAxisID?: string;
};
export type ChartDatasetDefinition = {
    /**
     * - Dataset identifier
     */
    id: string;
    /**
     * - Label for legend/tooltips
     */
    label: string;
    /**
     * - Record key for values
     */
    dataKey?: string;
    /**
     * - Selector for values
     */
    valueSelector?: (record: Record<string, unknown>, index: number) => number | null;
    /**
     * - Optional transform applied to each value
     */
    transform?: (value: number | null, record: Record<string, unknown>, index: number) => number | null;
    /**
     * - Explicit dataset color
     */
    color?: string;
    /**
     * - Y-axis ID
     */
    yAxisId?: string;
    /**
     * - Whether to hide the dataset
     */
    hidden?: boolean;
    /**
     * - Additional dataset options
     */
    datasetOptions?: Record<string, unknown>;
};
export type ChartDefinition = {
    /**
     * - Chart identifier
     */
    id: string;
    /**
     * - Chart title
     */
    title: string;
    /**
     * - Chart type
     */
    chartType: string;
    /**
     * - Dataset definitions
     */
    datasets: ChartDatasetDefinition[];
    /**
     * - Label selector for x-axis values
     */
    labelSelector?: (record: Record<string, unknown>, index: number) => string | number;
    /**
     * - X-axis label
     */
    xAxisLabel?: string;
    /**
     * - Y-axis label
     */
    yAxisLabel?: string;
};
export type ChartDefinitionOptions = {
    /**
     * - Chart settings injection
     */
    chartSettings?: Record<string, unknown>;
    /**
     * - Default dataset colors
     */
    defaultColorPalette?: string[];
};
export type ChartAxisSpec = {
    /**
     * - Axis ID (e.g. "x", "y", "y1")
     */
    id: string;
    /**
     * - Axis type
     */
    type: "linear" | "category" | "logarithmic";
    /**
     * - Position (e.g. "left", "right")
     */
    position?: string;
    /**
     * - Axis label text
     */
    label?: string;
    /**
     * - Whether to display the axis
     */
    display?: boolean;
};
export type ChartPluginSpec = {
    /**
     * - Whether to include zoom reset plugin
     */
    useZoomReset?: boolean;
    /**
     * - Whether to include chart background plugin
     */
    useBackground?: boolean;
};
export type ChartSpec = {
    /**
     * - Chart type
     */
    type: "line" | "bar" | "scatter" | "doughnut";
    /**
     * - Dataset specifications
     */
    datasets: ChartDatasetSpec[];
    /**
     * - Axis specifications
     */
    axes?: ChartAxisSpec[];
    /**
     * - Plugin configuration
     */
    plugins?: ChartPluginSpec;
    /**
     * - Chart title
     */
    title?: string;
    /**
     * - Whether to show legend
     */
    showLegend?: boolean;
    /**
     * - Whether to show grid lines
     */
    showGrid?: boolean;
};

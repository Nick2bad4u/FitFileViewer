// Enhanced configuration for chart customization
export const DEFAULT_MAX_POINTS = 250;
/**
 * Allowed options for maximum number of chart points.
 * Numeric values specify the limit; the string "all" means no limit.
 * Consumers should handle both number and string types.
 * @type {(number|string)[]}
 */
/**
 * Allowed options for maximum number of chart points.
 * Numeric values specify the limit; the string "all" means no limit.
 * WARNING: Selecting very high values (e.g., 100,000 or above, or "all") may cause significant performance issues or browser crashes, especially with large datasets.
 * UI components should consider enforcing a reasonable upper limit (e.g., 10,000) or display a warning to users when selecting large values.
 * @type {(number|string)[]}
 */
export const maxPointsOptions = [
    1,
    10,
    25,
    50,
    100,
    200,
    250,
    500,
    700,
    1000,
    2000,
    3000,
    5000,
    10000,
    50000, // Performance warning: values above 10,000 may be slow
    100000, // Performance warning: very slow for most users
    1000000, // Not recommended except for testing
    "all", // No limit; use with extreme caution
];
/**
 * Array of chart configuration option objects for customizing chart rendering.
 * Each option defines a configurable chart property, including its type, allowed values, default, and description.
 *
 * @typedef {Object} ChartOption
 * @property {string} id - Unique identifier for the option (used as a key).
 * @property {string} label - Human-readable label for UI display.
 * @property {string} type - Option type ("select", "toggle", "range", etc.).
 * @property {Array|undefined} options - Allowed values for "select" or "toggle" types.
 * @property {number|string|boolean} default - Default value for the option.
 * @property {string} description - Description of the option for tooltips/help.
 * @property {number} [min] - Minimum value (for "range" type).
 * @property {number} [max] - Maximum value (for "range" type).
 * @property {number} [step] - Step size (for "range" type).
 */
/**
 * Example usage:
 * import { chartOptionsConfig } from './chartOptionsConfig.js';
 * // Iterate over options to build a settings UI
 * chartOptionsConfig.forEach(opt => { ... });
 */
// Comprehensive chart configuration options
export const chartOptionsConfig = [
    {
        id: "maxpoints",
        label: "Max Points",
        type: "select",
        options: maxPointsOptions,
        default: DEFAULT_MAX_POINTS,
        description: "Maximum number of data points to display",
    },
    {
        id: "chartType",
        label: "Chart Type",
        type: "select",
        options: ["line", "bar", "scatter", "area"],
        default: "line",
        description:
            'Type of chart visualization ("area" displays a filled area under the line, distinct from "line" which may optionally use the Fill Area toggle)',
    },
    {
        id: "interpolation",
        label: "Interpolation",
        type: "select",
        options: ["linear", "monotone", "step"],
        default: "linear",
        description: "Line interpolation method",
    },
    {
        id: "animation",
        label: "Animation",
        type: "select",
        options: ["smooth", "fast", "none"],
        default: "smooth",
        description: "Chart animation style",
    },
    {
        id: "exportTheme",
        label: "Export Theme",
        type: "select",
        options: ["auto", "light", "dark", "transparent"],
        default: "auto",
        description: "Background theme for exported images (auto = current app theme)",
    },
    {
        id: "showGrid",
        label: "Grid",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show/hide chart grid lines",
    },
    {
        id: "showLegend",
        label: "Legend",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show/hide chart legend",
    },
    {
        id: "showTitle",
        label: "Title",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show/hide chart titles",
    },
    {
        id: "showPoints",
        label: "Data Points",
        type: "toggle",
        options: [true, false],
        default: false,
        description: "Show/hide individual data points",
    },
    {
        id: "showFill",
        label: "Fill Area",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Fill area under the line",
    },
    {
        id: "smoothing",
        label: "Line Smoothing",
        type: "range",
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.4,
        description:
            "Line curve smoothing amount (0 = no smoothing, 1 = maximum smoothing). Applies only to 'line' and 'area' chart types with 'monotone' or 'linear' interpolation.",
    },
    {
        id: "timeUnits",
        label: "Time Units",
        type: "select",
        options: ["seconds", "minutes", "hours"],
        default: "seconds",
        description: "Units for time display on axes and tooltips",
    },
    {
        id: "distanceUnits",
        label: "Distance Units",
        type: "select",
        options: ["meters", "kilometers", "feet", "miles"],
        default: "kilometers",
        description: "Units for distance/altitude display on axes and tooltips",
    },
    {
        id: "temperatureUnits",
        label: "Temperature Units",
        type: "select",
        options: ["celsius", "fahrenheit"],
        default: "celsius",
        description: "Units for temperature display on axes and tooltips",
    },
];

/**
 * @fileoverview Chart configuration options for FitFileViewer
 *
 * Defines the comprehensive configuration schema for chart customization
 * including data point limits, visualization types, styling options,
 * and unit preferences. Used by settings UI and chart rendering.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

// Default configuration constants
export const DEFAULT_MAX_POINTS = 250;

// Performance warning thresholds
const PERFORMANCE_THRESHOLDS = {
    SLOW_WARNING: 10000,
    VERY_SLOW_WARNING: 100000,
    NOT_RECOMMENDED: 1000000,
};

/**
 * Allowed options for maximum number of chart points
 *
 * WARNING: Selecting very high values may cause significant performance
 * issues or browser crashes, especially with large datasets. UI components
 * should enforce reasonable limits or display warnings for large values.
 *
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
    PERFORMANCE_THRESHOLDS.SLOW_WARNING, // 10,000 - Performance warning
    50000, // Performance warning
    PERFORMANCE_THRESHOLDS.VERY_SLOW_WARNING, // 100,000 - Very slow for most users
    PERFORMANCE_THRESHOLDS.NOT_RECOMMENDED, // 1,000,000 - Not recommended except for testing
    "all", // No limit; use with extreme caution
];

/**
 * Chart option configuration object
 * @typedef {Object} ChartOption
 * @property {string} id - Unique identifier for the option (used as localStorage key)
 * @property {string} label - Human-readable label for UI display
 * @property {string} type - Option type: "select", "toggle", "range"
 * @property {Array} [options] - Allowed values for "select" or "toggle" types
 * @property {number|string|boolean} default - Default value for the option
 * @property {string} description - Description of the option for tooltips/help
 * @property {number} [min] - Minimum value (for "range" type)
 * @property {number} [max] - Maximum value (for "range" type)
 * @property {number} [step] - Step size (for "range" type)
 */

/**
 * Comprehensive chart configuration options
 *
 * Defines all available chart customization options including data limits,
 * visualization types, styling preferences, and unit settings. Each option
 * specifies its type, allowed values, default, and description.
 *
 * @type {ChartOption[]}
 *
 * @example
 * import { chartOptionsConfig } from './chartOptionsConfig.js';
 * // Iterate over options to build a settings UI
 * chartOptionsConfig.forEach(opt => {
 *   console.log(`${opt.label}: ${opt.default}`);
 * });
 */
export const chartOptionsConfig = [
    {
        id: "maxpoints",
        label: "Max Points",
        type: "select",
        options: maxPointsOptions,
        default: DEFAULT_MAX_POINTS,
        description: "Maximum number of data points to display (higher values may impact performance)",
    },
    {
        id: "chartType",
        label: "Chart Type",
        type: "select",
        options: ["line", "bar", "scatter", "area"],
        default: "line",
        description:
            'Type of chart visualization ("area" displays filled area under line, distinct from "line" with optional Fill Area toggle)',
    },
    {
        id: "interpolation",
        label: "Interpolation",
        type: "select",
        options: ["linear", "monotone", "step"],
        default: "linear",
        description: "Line interpolation method for smooth curves or stepped visualization",
    },
    {
        id: "animation",
        label: "Animation",
        type: "select",
        options: ["smooth", "fast", "none"],
        default: "smooth",
        description: "Chart animation style (smooth for best visual effect, fast for performance, none to disable)",
    },
    {
        id: "exportTheme",
        label: "Export Theme",
        type: "select",
        options: ["auto", "light", "dark", "transparent"],
        default: "auto",
        description: "Background theme for exported chart images (auto uses current app theme)",
    },
    {
        id: "showGrid",
        label: "Grid",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show or hide chart grid lines for better data readability",
    },
    {
        id: "showLegend",
        label: "Legend",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show or hide chart legend identifying data series",
    },
    {
        id: "showTitle",
        label: "Title",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Show or hide chart titles",
    },
    {
        id: "showPoints",
        label: "Data Points",
        type: "toggle",
        options: [true, false],
        default: false,
        description: "Show or hide individual data point markers on lines",
    },
    {
        id: "showFill",
        label: "Fill Area",
        type: "toggle",
        options: [true, false],
        default: true,
        description: "Fill the area under line charts for better visual impact",
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
            "Line curve smoothing amount (0 = no smoothing, 1 = maximum smoothing). Applies to 'line' and 'area' charts with 'monotone' or 'linear' interpolation.",
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
        description: "Units for distance and altitude display on axes and tooltips",
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

/**
 * Gets default value for a specific chart option
 * @param {string} optionId - The ID of the chart option
 * @returns {*} Default value for the option, or undefined if not found
 */
export function getDefaultValue(optionId) {
    const option = chartOptionsConfig.find((opt) => opt.id === optionId);
    return option ? option.default : undefined;
}

/**
 * Gets chart option configuration by ID
 * @param {string} optionId - The ID of the chart option
 * @returns {ChartOption|undefined} Chart option configuration or undefined if not found
 */
export function getOptionConfig(optionId) {
    return chartOptionsConfig.find((opt) => opt.id === optionId);
}

/**
 * Validates if a value is valid for a given chart option
 * @param {string} optionId - The ID of the chart option
 * @param {*} value - Value to validate
 * @returns {boolean} True if value is valid for the option
 */
export function isValidOptionValue(optionId, value) {
    const option = getOptionConfig(optionId);
    if (!option) return false;

    switch (option.type) {
        case "select":
            return option.options.includes(value);

        case "toggle":
            return typeof value === "boolean";

        case "range":
            return typeof value === "number" && value >= (option.min || 0) && value <= (option.max || 1);

        default:
            return true;
    }
}

/**
 * Gets performance warning level for max points value
 * @param {number|string} maxPoints - Max points value to check
 * @returns {string|null} Warning level ("slow", "very-slow", "not-recommended") or null if no warning
 */
export function getMaxPointsWarningLevel(maxPoints) {
    if (maxPoints === "all") {
        return "not-recommended";
    }

    const numPoints = Number(maxPoints);
    if (numPoints >= PERFORMANCE_THRESHOLDS.NOT_RECOMMENDED) {
        return "not-recommended";
    } else if (numPoints >= PERFORMANCE_THRESHOLDS.VERY_SLOW_WARNING) {
        return "very-slow";
    } else if (numPoints >= PERFORMANCE_THRESHOLDS.SLOW_WARNING) {
        return "slow";
    }

    return null;
}

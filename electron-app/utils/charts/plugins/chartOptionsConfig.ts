/**
 * Default maximum number of chart points rendered.
 */
export const DEFAULT_MAX_POINTS = 250;

const PERFORMANCE_THRESHOLDS = {
    NOT_RECOMMENDED: 1_000_000,
    SLOW_WARNING: 10_000,
    VERY_SLOW_WARNING: 100_000,
} as const;

/**
 * Primitive value accepted by chart option controls.
 */
export type ChartOptionValue = boolean | number | string;

/**
 * Supported chart option control kinds.
 */
export type ChartOptionType = "range" | "select" | "toggle";

/**
 * Supported max-points choices.
 */
export type MaxPointsOption = "all" | number;

/**
 * Performance warning classifications for high max-points choices.
 */
export type MaxPointsWarningLevel = "not-recommended" | "slow" | "very-slow";

interface ChartOptionBase {
    description: string;
    id: string;
    label: string;
    type: ChartOptionType;
}

/**
 * Numeric range chart option configuration.
 */
export interface ChartRangeOption extends ChartOptionBase {
    default: number;
    max: number;
    min: number;
    step: number;
    type: "range";
}

/**
 * Select-list chart option configuration.
 */
export interface ChartSelectOption extends ChartOptionBase {
    default: ChartOptionValue;
    options: readonly ChartOptionValue[];
    type: "select";
}

/**
 * Boolean toggle chart option configuration.
 */
export interface ChartToggleOption extends ChartOptionBase {
    default: boolean;
    options: readonly boolean[];
    type: "toggle";
}

/**
 * Chart option configuration entry.
 */
export type ChartOption =
    | ChartRangeOption
    | ChartSelectOption
    | ChartToggleOption;

/**
 * Allowed options for maximum number of chart points.
 */
export const maxPointsOptions: readonly MaxPointsOption[] = [
    1,
    10,
    25,
    50,
    100,
    200,
    DEFAULT_MAX_POINTS,
    500,
    700,
    1000,
    2000,
    3000,
    5000,
    PERFORMANCE_THRESHOLDS.SLOW_WARNING,
    50_000,
    PERFORMANCE_THRESHOLDS.VERY_SLOW_WARNING,
    PERFORMANCE_THRESHOLDS.NOT_RECOMMENDED,
    "all",
];

/**
 * Comprehensive chart customization options used by settings UI and chart
 * rendering.
 */
export const chartOptionsConfig: readonly ChartOption[] = [
    {
        default: DEFAULT_MAX_POINTS,
        description:
            "Maximum number of data points to display (higher values may impact performance)",
        id: "maxpoints",
        label: "Max Points",
        options: maxPointsOptions,
        type: "select",
    },
    {
        default: "line",
        description:
            'Type of chart visualization ("area" displays filled area under line, distinct from "line" with optional Fill Area toggle)',
        id: "chartType",
        label: "Chart Type",
        options: [
            "line",
            "bar",
            "scatter",
            "area",
        ],
        type: "select",
    },
    {
        default: "linear",
        description:
            "Line interpolation method for smooth curves or stepped visualization",
        id: "interpolation",
        label: "Interpolation",
        options: [
            "linear",
            "monotone",
            "step",
        ],
        type: "select",
    },
    {
        default: "smooth",
        description:
            "Chart animation style (smooth for best visual effect, fast for performance, none to disable)",
        id: "animation",
        label: "Animation",
        options: [
            "smooth",
            "fast",
            "none",
        ],
        type: "select",
    },
    {
        default: "auto",
        description:
            "Background theme for exported chart images (auto uses current app theme)",
        id: "exportTheme",
        label: "Export Theme",
        options: [
            "auto",
            "light",
            "dark",
            "transparent",
        ],
        type: "select",
    },
    {
        default: true,
        description:
            "Show or hide chart grid lines for better data readability",
        id: "showGrid",
        label: "Grid",
        options: [true, false],
        type: "toggle",
    },
    {
        default: true,
        description: "Show or hide chart legend identifying data series",
        id: "showLegend",
        label: "Legend",
        options: [true, false],
        type: "toggle",
    },
    {
        default: true,
        description: "Show or hide chart titles",
        id: "showTitle",
        label: "Title",
        options: [true, false],
        type: "toggle",
    },
    {
        default: false,
        description: "Show or hide individual data point markers on lines",
        id: "showPoints",
        label: "Data Points",
        options: [true, false],
        type: "toggle",
    },
    {
        default: true,
        description: "Fill the area under line charts for better visual impact",
        id: "showFill",
        label: "Fill Area",
        options: [true, false],
        type: "toggle",
    },
    {
        default: 0.4,
        description:
            "Line curve smoothing amount (0 = no smoothing, 1 = maximum smoothing). Applies to 'line' and 'area' charts with 'monotone' or 'linear' interpolation.",
        id: "smoothing",
        label: "Line Smoothing",
        max: 1,
        min: 0,
        step: 0.1,
        type: "range",
    },
    {
        default: "seconds",
        description: "Units for time display on axes and tooltips",
        id: "timeUnits",
        label: "Time Units",
        options: [
            "seconds",
            "minutes",
            "hours",
        ],
        type: "select",
    },
    {
        default: "kilometers",
        description:
            "Units for distance and altitude display on axes and tooltips",
        id: "distanceUnits",
        label: "Distance Units",
        options: [
            "meters",
            "kilometers",
            "feet",
            "miles",
        ],
        type: "select",
    },
    {
        default: "celsius",
        description: "Units for temperature display on axes and tooltips",
        id: "temperatureUnits",
        label: "Temperature Units",
        options: ["celsius", "fahrenheit"],
        type: "select",
    },
];

/**
 * Get the default value for a chart option.
 */
export function getDefaultValue(
    optionId: string
): ChartOptionValue | undefined {
    return getOptionConfig(optionId)?.default;
}

/**
 * Get the performance warning level for a max-points value.
 */
export function getMaxPointsWarningLevel(
    maxPoints: MaxPointsOption
): MaxPointsWarningLevel | null {
    if (maxPoints === "all") {
        return "not-recommended";
    }

    const numPoints = Number(maxPoints);

    if (numPoints >= PERFORMANCE_THRESHOLDS.NOT_RECOMMENDED) {
        return "not-recommended";
    }

    if (numPoints >= PERFORMANCE_THRESHOLDS.VERY_SLOW_WARNING) {
        return "very-slow";
    }

    if (numPoints >= PERFORMANCE_THRESHOLDS.SLOW_WARNING) {
        return "slow";
    }

    return null;
}

/**
 * Get a chart option configuration by ID.
 */
export function getOptionConfig(optionId: string): ChartOption | undefined {
    return chartOptionsConfig.find((option) => option.id === optionId);
}

/**
 * Check whether a value is valid for a chart option.
 */
export function isValidOptionValue(optionId: string, value: unknown): boolean {
    const option = getOptionConfig(optionId);

    if (!option) {
        return false;
    }

    switch (option.type) {
        case "range": {
            return (
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= option.min &&
                value <= option.max
            );
        }

        case "select": {
            return option.options.includes(value as ChartOptionValue);
        }

        case "toggle": {
            return typeof value === "boolean";
        }
    }
}

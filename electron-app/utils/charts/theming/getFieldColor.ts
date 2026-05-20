/**
 * Default color for unmapped fields.
 */
export const DEFAULT_FIELD_COLOR = "#6B7280";

/**
 * Field color mapping configuration for charts and visualizations.
 */
export const FIELD_COLOR_MAP = {
    altitude: "#8B5CF6",
    auxHeartRate: "#d946ef",
    cadence: "#10B981",
    distance: "#84CC16",
    enhancedAltitude: "#cddc39",
    enhancedSpeed: "#009688",
    flow: "#c42196",
    gps_track: "#4caf50",
    grade: "#06B6D4",
    grit: "#6e1cbb",
    heartRate: "#EF4444",
    positionLat: "#ff5722",
    positionLong: "#3f51b5",
    power: "#F59E0B",
    resistance: "#795548",
    speed: "#3b82f665",
    temperature: "#EC4899",
} as const satisfies Record<string, string>;

/**
 * Field names with explicit chart color mappings.
 */
export type ChartFieldColorKey = keyof typeof FIELD_COLOR_MAP;

/**
 * Get all available field colors.
 *
 * @returns Copy of the field color mappings.
 */
export function getAllFieldColors(): Record<ChartFieldColorKey, string> {
    return { ...FIELD_COLOR_MAP };
}

/**
 * Get the standardized color for a chart field.
 *
 * @param field - Field name to get a color for.
 * @returns Mapped field color, or the default color for unknown fields.
 */
export function getFieldColor(field: unknown): string {
    if (typeof field !== "string") {
        console.warn(
            `[getFieldColor] Field must be a string, received ${typeof field}`
        );
        return DEFAULT_FIELD_COLOR;
    }

    if (!field.trim()) {
        console.warn("[getFieldColor] Empty field name provided");
        return DEFAULT_FIELD_COLOR;
    }

    const color = hasFieldColor(field)
        ? FIELD_COLOR_MAP[field]
        : DEFAULT_FIELD_COLOR;

    if (color === DEFAULT_FIELD_COLOR) {
        console.debug(
            `[getFieldColor] Using default color for unmapped field: ${field}`
        );
    }

    return color;
}

/**
 * Check if a field has a defined color mapping.
 *
 * @param field - Field name to check.
 * @returns Whether the field has a defined color.
 */
export function hasFieldColor(field: unknown): field is ChartFieldColorKey {
    return (
        typeof field === "string" &&
        Object.hasOwn(FIELD_COLOR_MAP, field)
    );
}

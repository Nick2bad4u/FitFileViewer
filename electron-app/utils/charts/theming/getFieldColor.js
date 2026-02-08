/**
 * Field color mapping configuration for charts and visualizations Provides
 * consistent color schemes across the FitFileViewer application
 *
 * @readonly
 */
const /**
     * Default color for unmapped fields
     *
     * @readonly
     */
    DEFAULT_FIELD_COLOR = "#6B7280", // Gray
    FIELD_COLOR_MAP = {
        altitude: "#8B5CF6", // Purple - elevation data
        cadence: "#10B981", // Green - cadence/RPM data
        distance: "#84CC16", // Lime - distance data
        enhancedAltitude: "#cddc39", // Light green - enhanced altitude data
        enhancedSpeed: "#009688", // Teal - enhanced speed data
        flow: "#c42196", // Magenta - flow data
        gps_track: "#4caf50", // Green - GPS track data
        grade: "#06B6D4", // Cyan - gradient/slope data
        grit: "#6e1cbb", // Dark purple - grit data
        heartRate: "#EF4444", // Red - heart rate data
        auxHeartRate: "#d946ef", // Fuchsia - auxiliary heart rate data
        positionLat: "#ff5722", // Deep orange - latitude data
        positionLong: "#3f51b5", // Indigo - longitude data
        power: "#F59E0B", // Orange - power/watts data
        resistance: "#795548", // Brown - resistance data
        speed: "#3b82f665", // Blue (transparent) - speed data
        temperature: "#EC4899", // Pink - temperature data
    };

/**
 * Gets all available field colors as an object
 *
 * @example
 *     // Get all available colors
 *     const allColors = getAllFieldColors();
 *
 * @returns {Object} Object containing all field color mappings
 */
export function getAllFieldColors() {
    return { ...FIELD_COLOR_MAP };
}

/**
 * Gets the standardized color for a given field type
 *
 * Provides consistent color mapping for chart visualizations and data displays.
 * Returns a default gray color for unmapped field types.
 *
 * @example
 *     // Get color for heart rate data
 *     const heartRateColor = getFieldColor("heartRate"); // "#EF4444"
 *
 *     // Get color for unknown field
 *     const unknownColor = getFieldColor("unknownField"); // "#6B7280"
 *
 * @param {string} field - The field name to get color for
 *
 * @returns {string} Hex color code for the field
 *
 * @throws {TypeError} If field is not a string
 */
export function getFieldColor(field) {
    // Input validation
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

    try {
        // Return mapped color or default
        const color =
            /** @type {any} */ (FIELD_COLOR_MAP)[field] || DEFAULT_FIELD_COLOR;

        // Log debug info for unmapped fields in development
        if (color === DEFAULT_FIELD_COLOR && field !== "") {
            console.debug(
                `[getFieldColor] Using default color for unmapped field: ${field}`
            );
        }

        return color;
    } catch (error) {
        console.error("[getFieldColor] Error getting field color:", error);
        return DEFAULT_FIELD_COLOR;
    }
}

/**
 * Checks if a field has a defined color mapping
 *
 * @example
 *     // Check if field has color mapping
 *     const hasColor = hasFieldColor("heartRate"); // true
 *
 * @param {string} field - The field name to check
 *
 * @returns {boolean} True if field has a defined color
 */
export function hasFieldColor(field) {
    return typeof field === "string" && field in FIELD_COLOR_MAP;
}

/**
 * Distance conversion constants
 * @readonly
 */
const DISTANCE_CONVERSIONS = {
    METERS_TO_KILOMETERS: 1000,
    METERS_TO_FEET: 3.28084,
    METERS_TO_MILES: 1609.344,
};

/**
 * Supported distance units
 * @readonly
 */
export const DISTANCE_UNITS = {
    METERS: "meters",
    KILOMETERS: "kilometers",
    FEET: "feet",
    MILES: "miles",
};

/**
 * Converts distance from meters to user's preferred units
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit (meters, kilometers, feet, miles)
 * @returns {number} Converted distance value
 * @throws {TypeError} If meters is not a number
 * @throws {Error} If targetUnit is not supported
 * @example
 * // Convert 1000 meters to kilometers
 * const km = convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS); // 1
 */
export function convertDistanceUnits(meters, targetUnit) {
    // Input validation
    if (typeof meters !== "number" || isNaN(meters)) {
        throw new TypeError(`Expected meters to be a number, received ${typeof meters}`);
    }

    if (meters < 0) {
        console.warn("[convertDistanceUnits] Negative distance value:", meters);
    }

    try {
        switch (targetUnit) {
            case DISTANCE_UNITS.KILOMETERS:
                return meters / DISTANCE_CONVERSIONS.METERS_TO_KILOMETERS;
            case DISTANCE_UNITS.FEET:
                return meters * DISTANCE_CONVERSIONS.METERS_TO_FEET;
            case DISTANCE_UNITS.MILES:
                return meters / DISTANCE_CONVERSIONS.METERS_TO_MILES;
            case DISTANCE_UNITS.METERS:
                return meters;
            default:
                console.warn(`[convertDistanceUnits] Unknown unit '${targetUnit}', defaulting to meters`);
                return meters;
        }
    } catch (error) {
        console.error("[convertDistanceUnits] Conversion failed:", error);
        const anyErr = /** @type {any} */ (error);
        throw new Error(`Failed to convert distance: ${anyErr?.message}`);
    }
}

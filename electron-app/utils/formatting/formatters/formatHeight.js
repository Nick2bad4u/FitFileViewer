/**
 * Height conversion constants
 * @readonly
 */
const HEIGHT_CONVERSIONS = {
    METERS_TO_INCHES: 39.3701,
    INCHES_PER_FOOT: 12,
};

/**
 * Converts height from meters to feet and inches with metric display
 * @param {number} meters - Height in meters
 * @returns {string} Formatted height string with both metric and imperial
 * @throws {TypeError} If meters is not a number
 * @example
 * // Convert 1.75m to imperial format
 * const height = formatHeight(1.75); // "1.75 m (5'9")"
 */
export function formatHeight(meters) {
    // Input validation
    if (typeof meters !== "number" || !Number.isFinite(meters)) {
        return "";
    }

    if (meters < 0) {
        console.warn("[formatHeight] Negative height value:", meters);
        return "";
    }

    try {
        const totalInches = meters * HEIGHT_CONVERSIONS.METERS_TO_INCHES;
        const feet = Math.floor(totalInches / HEIGHT_CONVERSIONS.INCHES_PER_FOOT);
        let inches = Math.round(totalInches % HEIGHT_CONVERSIONS.INCHES_PER_FOOT);

        // Handle rounding up to 12 inches (e.g., 5'12" -> 6'0")
        let adjustedFeet = feet;
        if (inches === HEIGHT_CONVERSIONS.INCHES_PER_FOOT) {
            adjustedFeet += 1;
            inches = 0;
        }

        // Always format meters to two decimal places for consistency
        const metersStr = meters.toFixed(2);

        return `${metersStr} m (${adjustedFeet}'${inches}")`;
    } catch (error) {
        console.error("[formatHeight] Height formatting failed:", error);
        return meters.toString();
    }
}

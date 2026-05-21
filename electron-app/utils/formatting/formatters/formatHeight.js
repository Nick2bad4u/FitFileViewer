import { CONVERSION_FACTORS } from "../../config/index.js";
/**
 * Converts meters to a metric and feet/inches display string.
 *
 * Invalid inputs return an empty string and log a warning, matching the legacy
 * renderer behavior.
 *
 * @example FormatHeight(1.75); // "1.75 m (5'9")"
 *
 * @param meters - Height in meters.
 *
 * @returns Formatted height string, or an empty string for invalid input.
 */
export function formatHeight(meters) {
    if (typeof meters !== "number" || !Number.isFinite(meters)) {
        console.warn("[formatHeight] Invalid height value:", meters);
        return "";
    }
    if (meters < 0) {
        console.warn("[formatHeight] Negative height value:", meters);
        return "";
    }
    try {
        const totalInches = meters * CONVERSION_FACTORS.METERS_TO_INCHES,
            feet = Math.floor(totalInches / CONVERSION_FACTORS.INCHES_PER_FOOT);
        let inches = Math.round(
            totalInches % CONVERSION_FACTORS.INCHES_PER_FOOT
        );
        let adjustedFeet = feet;
        if (inches === CONVERSION_FACTORS.INCHES_PER_FOOT) {
            adjustedFeet += 1;
            inches = 0;
        }
        const metersString = meters.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES);
        return `${metersString} m (${adjustedFeet}'${inches}")`;
    } catch (error) {
        console.error("[formatHeight] Height formatting failed:", error);
        return meters.toString();
    }
}

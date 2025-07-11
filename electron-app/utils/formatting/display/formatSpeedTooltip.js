import { convertMpsToKmh } from "../converters/convertMpsToKmh.js";
import { convertMpsToMph } from "../converters/convertMpsToMph.js";

/**
 * Speed formatting configuration for tooltips
 * @readonly
 */
const SPEED_FORMAT_CONFIG = {
    DECIMAL_PLACES: 2,
    UNITS: {
        MPS: "m/s",
        KMH: "km/h",
        MPH: "mph",
    },
    ERROR_MESSAGES: {
        INVALID_SPEED: "Invalid speed value for tooltip formatting:",
        CONVERSION_ERROR: "Error formatting speed tooltip:",
    },
};

/**
 * Formats speed with all three units for comprehensive tooltip display
 *
 * Converts meters per second to km/h and mph, displaying all three values
 * for maximum user information. Handles invalid inputs gracefully.
 *
 * @param {number} mps - Speed in meters per second
 * @returns {string} Formatted speed string with all units
 * @throws {TypeError} If mps is not a number
 * @example
 * // Format speed for tooltip
 * const speedTooltip = formatSpeedTooltip(5.5);
 * // "5.50 m/s (19.80 km/h, 12.30 mph)"
 */
export function formatSpeedTooltip(mps) {
    // Input validation
    if (typeof mps !== "number" || isNaN(mps)) {
        console.warn(`[formatSpeedTooltip] ${SPEED_FORMAT_CONFIG.ERROR_MESSAGES.INVALID_SPEED}`, mps);
        return "0.00 m/s (0.00 km/h, 0.00 mph)";
    }

    if (mps < 0) {
        console.warn(`[formatSpeedTooltip] Negative speed value: ${mps}`);
    }

    try {
        // Convert to different units
        const kmh = convertMpsToKmh(mps);
        const mph = convertMpsToMph(mps);

        // Format with consistent decimal places
        const mpsStr = mps.toFixed(SPEED_FORMAT_CONFIG.DECIMAL_PLACES);
        const kmhStr = kmh.toFixed(SPEED_FORMAT_CONFIG.DECIMAL_PLACES);
        const mphStr = mph.toFixed(SPEED_FORMAT_CONFIG.DECIMAL_PLACES);

        return `${mpsStr} ${SPEED_FORMAT_CONFIG.UNITS.MPS} (${kmhStr} ${SPEED_FORMAT_CONFIG.UNITS.KMH}, ${mphStr} ${SPEED_FORMAT_CONFIG.UNITS.MPH})`;
    } catch (error) {
        console.error(`[formatSpeedTooltip] ${SPEED_FORMAT_CONFIG.ERROR_MESSAGES.CONVERSION_ERROR}`, error);
        return "0.00 m/s (0.00 km/h, 0.00 mph)";
    }
}

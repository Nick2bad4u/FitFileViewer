/**
 * @version 2.0.0 - Updated to use centralized configuration and unified error
 *   handling
 *
 * @file Height formatting utility for FitFileViewer
 *
 *   Provides functions for converting and formatting heights from meters to
 *   human-readable strings with both metric and imperial units.
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

import { CONVERSION_FACTORS } from "../../config/index.js";

/**
 * Converts height from meters to feet and inches with metric display
 *
 * @example
 *     // Convert 1.75m to imperial format
 *     const height = formatHeight(1.75); // "1.75 m (5'9\")"
 *
 * @param {number} meters - Height in meters
 *
 * @returns {string} Formatted height string with both metric and imperial
 */
export function formatHeight(meters) {
    // Handle invalid inputs with warnings
    if (
        meters === null ||
        meters === undefined ||
        typeof meters !== "number" ||
        !Number.isFinite(meters)
    ) {
        console.warn("[formatHeight] Invalid height value:", meters);
        return "";
    }

    // Handle negative values with warning
    if (meters < 0) {
        console.warn("[formatHeight] Negative height value:", meters);
        return "";
    }

    try {
        const totalInches = meters * CONVERSION_FACTORS.METERS_TO_INCHES;
        const feet = Math.floor(
            totalInches / CONVERSION_FACTORS.INCHES_PER_FOOT
        );
        let inches = Math.round(
            totalInches % CONVERSION_FACTORS.INCHES_PER_FOOT
        );

        // Handle rounding up to 12 inches (e.g., 5'12" -> 6'0")
        let adjustedFeet = feet;
        if (inches === CONVERSION_FACTORS.INCHES_PER_FOOT) {
            adjustedFeet += 1;
            inches = 0;
        }

        // Always format meters to two decimal places for consistency
        const metersStr = meters.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES);

        return `${metersStr} m (${adjustedFeet}'${inches}")`;
    } catch (error) {
        console.error("[formatHeight] Height formatting failed:", error);
        return meters.toString(); // Return fallback as expected by tests
    }
}

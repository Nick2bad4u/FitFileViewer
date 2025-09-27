/**
 * @fileoverview Distance unit conversion utility for FitFileViewer
 *
 * Provides functions for converting distances between different units (meters, kilometers, feet, miles)
 * with consistent error handling and validation.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 * @version 2.0.0 - Updated to use centralized configuration and unified error handling
 */

import { CONVERSION_FACTORS, DISTANCE_UNITS } from "../../config/index.js";
import { withErrorHandling } from "../../errors/index.js";

// Re-export DISTANCE_UNITS for backward compatibility
export { DISTANCE_UNITS } from "../../config/index.js";

/**
 * Converts distance from meters to user's preferred units
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit (meters, kilometers, feet, miles)
 * @returns {number} Converted distance value
 * @example
 * // Convert 1000 meters to kilometers
 * const km = convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS); // 1
 */
export const convertDistanceUnits = withErrorHandling(
    function convertDistanceUnitsInternal(meters, targetUnit) {
        // Type validation - throw TypeError for non-numbers with specific format expected by tests
        if (typeof meters !== "number") {
            const receivedType = meters === null ? "object" : typeof meters;
            throw new TypeError(`Expected meters to be a number, received ${receivedType}`);
        }

        // Handle Infinity values - they should be allowed and convert properly
        if (Number.isNaN(meters)) {
            throw new TypeError(`Expected meters to be a number, received number`);
        }

        // Warn about negative distances but still convert
        if (meters < 0) {
            console.warn("[convertDistanceUnits] Negative distance value:", meters);
        }

        // Validate target unit
        const validUnits = Object.values(DISTANCE_UNITS);
        if (!validUnits.includes(targetUnit)) {
            console.warn(`[convertDistanceUnits] Unknown unit '${targetUnit}', defaulting to meters`);
            return meters;
        }

        switch (targetUnit) {
            case DISTANCE_UNITS.FEET: {
                return meters * CONVERSION_FACTORS.METERS_TO_FEET;
            }
            case DISTANCE_UNITS.KILOMETERS: {
                return meters / CONVERSION_FACTORS.METERS_PER_KILOMETER;
            }
            case DISTANCE_UNITS.METERS: {
                return meters;
            }
            case DISTANCE_UNITS.MILES: {
                return meters / CONVERSION_FACTORS.METERS_PER_MILE;
            }
            default: {
                return meters;
            }
        }
    },
    {
        failSafe: false, // Throw errors for invalid conversions
        logError: true,
        notify: false,
    }
);

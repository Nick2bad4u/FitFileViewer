/**
 * @fileoverview Distance formatting utility for FitFileViewer
 *
 * Provides functions for converting and formatting distances from meters
 * to human-readable strings with both metric and imperial units.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 * @version 2.0.0 - Updated to use centralized configuration
 */

import { CONVERSION_FACTORS } from "../../config/index.js";
import { validateInput, validators } from "../../errors/index.js";

/**
 * Formats a distance in meters to a string showing both kilometers and miles
 *
 * Converts the input distance to both metric (kilometers) and imperial (miles)
 * units and returns a formatted string. Invalid inputs (negative, zero, NaN,
 * or non-finite numbers) return an empty string.
 *
 * @param {number} meters - The distance in meters to format. Must be a finite positive number.
 * @returns {string} The formatted distance as "X.XX km / Y.YY mi", or an empty string if invalid
 *
 * @example
 * formatDistance(1000);     // "1.00 km / 0.62 mi"
 * formatDistance(5000);     // "5.00 km / 3.11 mi"
 * formatDistance(-100);     // ""
 * formatDistance(NaN);      // ""
 */
export function formatDistance(meters) {
    // Use unified validation
    const validation = validateInput(
        meters,
        [validators.isRequired, validators.isFiniteNumber, validators.isPositiveNumber],
        "distance"
    );

    if (!validation.isValid) {
        // Fail-safe: return empty string for backward compatibility
        return "";
    }

    const kilometers = metersToKilometers(validation.validatedValue),
        miles = metersToMiles(validation.validatedValue);

    return `${kilometers.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES)} km / ${miles.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES)} mi`;
}

/**
 * Converts meters to kilometers using centralized constants
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in kilometers
 */
function metersToKilometers(meters) {
    return meters / CONVERSION_FACTORS.METERS_PER_KILOMETER;
}

/**
 * Converts meters to miles using centralized constants
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in miles
 */
function metersToMiles(meters) {
    return meters / CONVERSION_FACTORS.METERS_PER_MILE;
}

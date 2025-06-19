/**
 * @fileoverview Distance formatting utility for FitFileViewer
 * 
 * Provides functions for converting and formatting distances from meters
 * to human-readable strings with both metric and imperial units.
 * 
 * @author FitFileViewer Team
 * @since 1.0.0
 */

// Conversion constants
const CONVERSION_FACTORS = {
    METERS_PER_KILOMETER: 1000,
    METERS_PER_MILE: 1609.34,
    DECIMAL_PLACES: 2,
};

// Validation constants
const VALIDATION = {
    MIN_DISTANCE: 0,
};

/**
 * Validates distance input value
 * @param {number} meters - Distance value to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidDistance(meters) {
    return typeof meters === 'number' && 
           Number.isFinite(meters) && 
           !Number.isNaN(meters) && 
           meters > VALIDATION.MIN_DISTANCE;
}

/**
 * Converts meters to kilometers
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in kilometers
 */
function metersToKilometers(meters) {
    return meters / CONVERSION_FACTORS.METERS_PER_KILOMETER;
}

/**
 * Converts meters to miles
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in miles
 */
function metersToMiles(meters) {
    return meters / CONVERSION_FACTORS.METERS_PER_MILE;
}

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
    if (!isValidDistance(meters)) {
        return "";
    }

    const kilometers = metersToKilometers(meters);
    const miles = metersToMiles(meters);

    return `${kilometers.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES)} km / ${miles.toFixed(CONVERSION_FACTORS.DECIMAL_PLACES)} mi`;
}

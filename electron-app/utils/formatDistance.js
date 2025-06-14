/**
 * Formats a distance in meters to a string showing both kilometers and miles.
 *
 * @param {number} meters - The distance in meters to format. Must be a finite positive number.
 * @returns {string} The formatted distance as "X.XX km / Y.YY mi", or an empty string if the input is invalid (e.g., negative, zero, or non-numeric).
 */
const METERS_PER_KILOMETER = 1000;
const METERS_PER_MILE = 1609.34;

export function formatDistance(meters) {
    if (meters <= 0 || Number.isNaN(meters) || !Number.isFinite(meters)) return "";
    const kilometers = meters / METERS_PER_KILOMETER;
    const miles = meters / METERS_PER_MILE;
    return `${kilometers.toFixed(2)} km / ` + `${miles.toFixed(2)} mi`;
}

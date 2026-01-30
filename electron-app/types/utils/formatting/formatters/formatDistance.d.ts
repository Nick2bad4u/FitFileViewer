/**
 * Formats a distance in meters to a string showing both kilometers and miles
 *
 * Converts the input distance to both metric (kilometers) and imperial (miles)
 * units and returns a formatted string. Invalid inputs (negative, zero, NaN, or
 * non-finite numbers) return an empty string.
 *
 * @example
 *     formatDistance(1000); // "1.00 km / 0.62 mi"
 *     formatDistance(5000); // "5.00 km / 3.11 mi"
 *     formatDistance(-100); // ""
 *     formatDistance(NaN); // ""
 *
 * @param {number} meters - The distance in meters to format. Must be a finite
 *   positive number.
 *
 * @returns {string} The formatted distance as "X.XX km / Y.YY mi", or an empty
 *   string if invalid
 */
export function formatDistance(meters: number): string;

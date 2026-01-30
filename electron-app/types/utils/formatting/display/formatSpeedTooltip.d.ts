/**
 * Formats speed with all three units for comprehensive tooltip display
 *
 * Converts meters per second to km/h and mph, displaying all three values for
 * maximum user information. Handles invalid inputs gracefully.
 *
 * @example
 *     // Format speed for tooltip
 *     const speedTooltip = formatSpeedTooltip(5.5);
 *     // "5.50 m/s (19.80 km/h, 12.30 mph)"
 *
 * @param {number} mps - Speed in meters per second
 *
 * @returns {string} Formatted speed string with all units
 *
 * @throws {TypeError} If mps is not a number
 */
export function formatSpeedTooltip(mps: number): string;

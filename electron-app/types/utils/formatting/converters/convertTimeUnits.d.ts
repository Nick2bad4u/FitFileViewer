/**
 * Converts time from seconds to user's preferred units
 *
 * @example
 *     // Convert 3600 seconds to hours
 *     const hours = convertTimeUnits(3600, TIME_UNITS.HOURS); // 1
 *
 * @param {number} seconds - Time in seconds
 * @param {string} targetUnit - Target unit (seconds, minutes, hours)
 *
 * @returns {number} Converted time value
 *
 * @throws {TypeError} If seconds is not a number
 */
export function convertTimeUnits(seconds: number, targetUnit: string): number;
export namespace TIME_UNITS {
    let HOURS: string;
    let MINUTES: string;
    let SECONDS: string;
}

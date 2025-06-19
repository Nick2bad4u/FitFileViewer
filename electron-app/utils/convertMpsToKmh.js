/**
 * Converts m/s to km/h
 * @param {number} mps - Speed in meters per second
 * @returns {number} Speed in kilometers per hour
 * @example
 * // Convert 5 meters per second to kilometers per hour
 * const speedKmh = convertMpsToKmh(5); // 18
 */
export function convertMpsToKmh(mps) {
    return mps * 3.6;
}

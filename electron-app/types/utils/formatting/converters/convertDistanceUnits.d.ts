export { DISTANCE_UNITS } from "../../config/index.js";
/**
 * Converts distance from meters to user's preferred units
 *
 * @example
 *     // Convert 1000 meters to kilometers
 *     const km = convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS); // 1
 *
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit (meters, kilometers, feet, miles)
 *
 * @returns {number} Converted distance value
 */
export const convertDistanceUnits: Function;

/**
 * Converts values according to user's preferred units based on field type
 * @param {number} value - Raw value to convert
 * @param {string} field - Field name that determines conversion type
 * @returns {number} Converted value in user's preferred units
 * @throws {TypeError} If value is not a number
 * @example
 * // Convert distance from meters to user preference (e.g., kilometers)
 * const convertedDistance = convertValueToUserUnits(1000, "distance");
 *
 * // Convert temperature from Celsius to user preference (e.g., Fahrenheit)
 * const convertedTemp = convertValueToUserUnits(25, "temperature");
 */
export function convertValueToUserUnits(value: number, field: string): number;
//# sourceMappingURL=convertValueToUserUnits.d.ts.map
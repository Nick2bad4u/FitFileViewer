/**
 * Converts temperature from Celsius to user's preferred units
 * @param {number} celsius - Temperature in Celsius
 * @param {string} targetUnit - Target unit (celsius, fahrenheit)
 * @returns {number} Converted temperature value
 * @throws {TypeError} If celsius is not a number
 * @example
 * // Convert 25°C to Fahrenheit
 * const tempF = convertTemperatureUnits(25, TEMPERATURE_UNITS.FAHRENHEIT); // 77
 */
export function convertTemperatureUnits(celsius: number, targetUnit: string): number;
export namespace TEMPERATURE_UNITS {
    let CELSIUS: string;
    let FAHRENHEIT: string;
}
//# sourceMappingURL=convertTemperatureUnits.d.ts.map
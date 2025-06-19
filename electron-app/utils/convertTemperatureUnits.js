/**
 * Converts temperature to user's preferred units
 * @param {number} celsius - Temperature in Celsius
 * @param {string} targetUnit - Target unit (celsius, fahrenheit)
 * @returns {number} Converted temperature value
 * @throws {TypeError} If celsius is not a number
 * @example
 * // Convert 25°C to Fahrenheit
 * const tempF = convertTemperatureUnits(25, "fahrenheit"); // 77
 */
export function convertTemperatureUnits(celsius, targetUnit) {
    if (typeof celsius !== "number" || Number.isNaN(celsius)) {
        throw new TypeError("celsius must be a valid number");
    }
    switch (targetUnit) {
        case "fahrenheit":
            return (celsius * 9) / 5 + 32;
        case "celsius":
        default:
            return celsius;
    }
}

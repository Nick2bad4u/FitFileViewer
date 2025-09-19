/**
 * Temperature conversion constants
 * @readonly
 */
const TEMPERATURE_CONVERSIONS = {
    CELSIUS_TO_FAHRENHEIT_MULTIPLIER: 9 / 5,
    FAHRENHEIT_OFFSET: 32,
};

/**
 * Supported temperature units
 * @readonly
 */
export const TEMPERATURE_UNITS = {
    CELSIUS: "celsius",
    FAHRENHEIT: "fahrenheit",
};

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
export function convertTemperatureUnits(celsius, targetUnit) {
    // Input validation
    if (typeof celsius !== "number" || Number.isNaN(celsius)) {
        throw new TypeError(`Expected celsius to be a number, received ${typeof celsius}`);
    }

    try {
        switch (targetUnit) {
            case TEMPERATURE_UNITS.CELSIUS: {
                return celsius;
            }
            case TEMPERATURE_UNITS.FAHRENHEIT: {
                return (
                    celsius * TEMPERATURE_CONVERSIONS.CELSIUS_TO_FAHRENHEIT_MULTIPLIER +
                    TEMPERATURE_CONVERSIONS.FAHRENHEIT_OFFSET
                );
            }
            default: {
                console.warn(`[convertTemperatureUnits] Unknown unit '${targetUnit}', defaulting to celsius`);
                return celsius;
            }
        }
    } catch (error) {
        console.error("[convertTemperatureUnits] Conversion failed:", error);
        const anyErr = /** @type {any} */ (error);
        throw new Error(`Failed to convert temperature: ${anyErr?.message}`);
    }
}

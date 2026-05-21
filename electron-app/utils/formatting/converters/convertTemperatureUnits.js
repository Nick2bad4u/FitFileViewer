const TEMPERATURE_CONVERSIONS = {
    CELSIUS_TO_FAHRENHEIT_MULTIPLIER: 9 / 5,
    FAHRENHEIT_OFFSET: 32,
};
/**
 * Supported temperature units.
 */
export const TEMPERATURE_UNITS = {
    CELSIUS: "celsius",
    FAHRENHEIT: "fahrenheit",
};
/**
 * Converts a Celsius temperature to the requested display unit.
 *
 * Unknown units preserve legacy behavior by warning and returning Celsius.
 *
 * @example Const tempF = convertTemperatureUnits(25,
 * TEMPERATURE_UNITS.FAHRENHEIT); // 77
 *
 * @param celsius - Temperature in Celsius.
 * @param targetUnit - Target unit: celsius or fahrenheit.
 *
 * @returns Converted temperature value.
 *
 * @throws TypeError If celsius is not a number or is NaN.
 */
export function convertTemperatureUnits(celsius, targetUnit) {
    if (typeof celsius !== "number" || Number.isNaN(celsius)) {
        throw new TypeError(
            `Expected celsius to be a number, received ${typeof celsius}`
        );
    }
    try {
        switch (targetUnit) {
            case TEMPERATURE_UNITS.CELSIUS: {
                return celsius;
            }
            case TEMPERATURE_UNITS.FAHRENHEIT: {
                return (
                    celsius *
                        TEMPERATURE_CONVERSIONS.CELSIUS_TO_FAHRENHEIT_MULTIPLIER +
                    TEMPERATURE_CONVERSIONS.FAHRENHEIT_OFFSET
                );
            }
            default: {
                console.warn(
                    `[convertTemperatureUnits] Unknown unit '${targetUnit}', defaulting to celsius`
                );
                return celsius;
            }
        }
    } catch (error) {
        console.error("[convertTemperatureUnits] Conversion failed:", error);
        throw new Error(
            `Failed to convert temperature: ${getErrorMessage(error)}`
        );
    }
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

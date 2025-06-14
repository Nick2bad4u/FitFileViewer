/**
 * Converts temperature to user's preferred units
 * @param {number} celsius - Temperature in Celsius
 * @param {string} targetUnit - Target unit (celsius, fahrenheit)
 * @returns {number} Converted temperature value
 */
export function convertTemperatureUnits(celsius, targetUnit) {
	switch (targetUnit) {
		case 'fahrenheit':
			return (celsius * 9 / 5) + 32;
		case 'celsius':
		default:
			return celsius;
	}
}

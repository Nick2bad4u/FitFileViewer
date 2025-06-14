import { convertDistanceUnits } from './convertDistanceUnits.js';
import { convertTemperatureUnits } from './convertTemperatureUnits.js';
import { convertValueToUserUnits } from './convertValueToUserUnits.js';
import { formatSpeedTooltip } from './formatSpeedTooltip.js';
import { getUnitSymbol } from './getUnitSymbol.js';

/**
 * Formats tooltip with units based on user preferences
 * @param {number} value - Raw value
 * @param {string} field - Field name
 * @returns {string} Formatted tooltip text
 */
export function formatTooltipWithUnits(value, field) {
	// Distance fields - show both metric and imperial
	if (field === 'distance' || field === 'altitude' || field === 'enhancedAltitude') {
		const km = convertDistanceUnits(value, 'kilometers');
		const miles = convertDistanceUnits(value, 'miles');
		return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
	}

	// Speed fields - show all three units
	if (field === 'speed' || field === 'enhancedSpeed') {
		return formatSpeedTooltip(value);
	}

	// Temperature fields - show both scales
	if (field === 'temperature') {
		const celsius = value; // Assuming input is Celsius
		const fahrenheit = convertTemperatureUnits(celsius, 'fahrenheit');
		return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
	}

	// Default formatting for other fields
	const unitSymbol = getUnitSymbol(field);
	const convertedValue = convertValueToUserUnits(value, field);
	return `${convertedValue.toFixed(2)}${unitSymbol ? ' ' + unitSymbol : ''}`;
}

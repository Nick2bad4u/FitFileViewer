/**
 * Gets the unit symbol for display
 * @param {string} field - Field name
 * @param {string} unitType - Unit type (timeUnits, distanceUnits, temperatureUnits)
 * @returns {string} Unit symbol
 */
export function getUnitSymbol(field, unitType) {
	const timeUnits = localStorage.getItem('chartjs_timeUnits') || 'seconds';
	const distanceUnits = localStorage.getItem('chartjs_distanceUnits') || 'kilometers';
	const temperatureUnits = localStorage.getItem('chartjs_temperatureUnits') || 'celsius';

	// Distance-related fields
	if (field === 'distance' || field === 'altitude' || field === 'enhancedAltitude') {
		switch (distanceUnits) {
			case 'kilometers': return 'km';
			case 'feet': return 'ft';
			case 'miles': return 'mi';
			case 'meters':
			default: return 'm';
		}
	}

	// Temperature fields
	if (field === 'temperature') {
		return temperatureUnits === 'fahrenheit' ? '°F' : '°C';
	}

	// Speed fields - always show multiple units in tooltips
	if (field === 'speed' || field === 'enhancedSpeed') {
		return 'm/s';
	}

	// Time fields (for axes)
	if (unitType === 'time') {
		switch (timeUnits) {
			case 'minutes': return 'min';
			case 'hours': return 'h';
			case 'seconds':
			default: return 's';
		}
	}

	// Fallback to original field labels
	const originalLabels = {
		heartRate: 'bpm',
		power: 'W',
		cadence: 'rpm',
		resistance: '',
		flow: '',
		grit: '',
		positionLat: '°',
		positionLong: '°'
	};

	return originalLabels[field] || '';
}

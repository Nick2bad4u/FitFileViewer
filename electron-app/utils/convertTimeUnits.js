/**
 * Converts time to user's preferred units
 * @param {number} seconds - Time in seconds
 * @param {string} targetUnit - Target unit (seconds, minutes, hours)
 * @returns {number} Converted time value
 */
export function convertTimeUnits(seconds, targetUnit) {
	switch (targetUnit) {
		case 'minutes':
			return seconds / 60;
		case 'hours':
			return seconds / 3600;
		case 'seconds':
		default:
			return seconds;
	}
}

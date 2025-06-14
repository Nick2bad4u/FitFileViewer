import { mpsToKmh } from './mpsToKmh.js';
import { mpsToMph } from './mpsToMph.js';

/**
 * Formats speed with all three units for tooltips
 * @param {number} mps - Speed in meters per second
 * @returns {string} Formatted speed string
 */
export function formatSpeedTooltip(mps) {
	const kmh = mpsToKmh(mps);
	const mph = mpsToMph(mps);
	return `${mps.toFixed(2)} m/s (${kmh.toFixed(2)} km/h, ${mph.toFixed(2)} mph)`;
}

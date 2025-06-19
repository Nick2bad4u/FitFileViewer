import { convertMpsToKmh } from "./convertMpsToKmh.js";
import { convertMpsToMph } from "./convertMpsToMph.js";

/**
 * Formats speed with all three units for tooltips
 * @param {number} mps - Speed in meters per second
 * @returns {string} Formatted speed string
 */
export function formatSpeedTooltip(mps) {
    const kmh = convertMpsToKmh(mps);
    const mph = convertMpsToMph(mps);
    return `${mps.toFixed(2)} m/s (${kmh.toFixed(2)} km/h, ${mph.toFixed(2)} mph)`;
}

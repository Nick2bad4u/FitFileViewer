/**
 * Renders a single heart rate zone bar (e.g., for a summary or lap)
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object[]} zoneData - Array of zone objects {label, value, color}
 * @param {Object} [options={}] - Chart options (theme, title, etc.). Default is
 *   `{}`
 *
 * @returns {any | null} Chart.js instance or null on error
 */
export function renderSingleHRZoneBar(
    canvas: HTMLCanvasElement,
    zoneData: Object[],
    options?: Object
): any | null;

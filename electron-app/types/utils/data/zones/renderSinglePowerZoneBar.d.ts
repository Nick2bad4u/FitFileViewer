/**
 * Renders a single power zone bar (e.g., for a summary or lap)
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {{ label: string; value: number; color?: string }[]} zoneData - Array
 *   of zone objects {label, value, color}
 * @param {{ title?: string }} [options={}] - Chart options (theme, title,
 *   etc.). Default is `{}`
 *
 * @returns {any | null} Chart.js instance or null on error
 */
export function renderSinglePowerZoneBar(
    canvas: HTMLCanvasElement,
    zoneData: Array<{
        label: string;
        value: number;
        color?: string;
    }>,
    options?: {
        title?: string;
    }
): any | null;

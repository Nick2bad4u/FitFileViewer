/**
 * Creates a canvas element for rendering a chart.
 *
 * @param {string} field - The data field name for the chart (e.g.,
 *   "heartRate").
 * @param {number} index - The index of the chart instance.
 *
 * @returns {HTMLCanvasElement} The configured canvas element for the chart.
 */
export function createChartCanvas(
    field: string,
    index: number
): HTMLCanvasElement;

// Helper function to create chart canvas element
/**
 * Creates a canvas element for rendering a chart.
 *
 * @param {string} field - The data field name for the chart (e.g.,
 *   "heartRate").
 * @param {number} index - The index of the chart instance.
 *
 * @returns {HTMLCanvasElement} The configured canvas element for the chart.
 */
export function createChartCanvas(field, index) {
    const canvas = document.createElement("canvas");
    canvas.id = `chart-${field}-${index}`;
    canvas.className = "chart-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Chart for ${field}`);

    // Set responsive canvas dimensions
    canvas.style.width = "100%";
    canvas.style.maxHeight = "400px";
    canvas.style.marginBottom = "20px";
    canvas.style.borderRadius = "8px";
    canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

    return canvas;
}

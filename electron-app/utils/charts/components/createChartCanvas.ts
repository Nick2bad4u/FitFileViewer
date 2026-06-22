import { getCreateChartCanvasRuntime } from "./createChartCanvasRuntime.js";

const createChartCanvasRuntime = getCreateChartCanvasRuntime();

/**
 * Create the canvas element used by Chart.js renderers.
 *
 * @param field - Data field name for the chart.
 * @param index - Index of the chart instance.
 *
 * @returns Configured canvas element for the chart.
 */
export function createChartCanvas(
    field: string,
    index: number
): HTMLCanvasElement {
    const canvas = createChartCanvasRuntime.createCanvas();
    canvas.id = `chart-${field}-${index}`;
    canvas.className = "chart-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Chart for ${field}`);

    canvas.style.width = "100%";
    canvas.style.maxHeight = "400px";
    canvas.style.marginBottom = "20px";
    canvas.style.borderRadius = "8px";
    canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

    return canvas;
}

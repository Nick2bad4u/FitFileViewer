/**
 * Renders a chart showing GPS position (latitude and longitude) plotted against time.
 * This allows users to correlate specific timestamps with exact GPS locations,
 * making it easy to identify where events like top speed occurred.
 *
 * @param {HTMLElement} container - Container element for the chart
 * @param {any[]} data - Array of record messages with position and timestamp data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options - Chart configuration options
 */
export function renderGPSTimeChart(
    container: HTMLElement,
    data: any[],
    options: {
        maxPoints: number | "all";
        showPoints?: boolean;
        showLegend?: boolean;
        showTitle?: boolean;
        showGrid?: boolean;
    }
): void;

/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{ maxPoints: number|"all", showPoints?: boolean, showLegend?: boolean, showTitle?: boolean, showGrid?: boolean }} options
 */
export function renderGPSTrackChart(
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

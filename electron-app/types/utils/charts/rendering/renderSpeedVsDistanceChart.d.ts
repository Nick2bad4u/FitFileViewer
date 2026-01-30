/**
 * @param {HTMLElement} container
 * @param {any[]} data
 * @param {{
 *     maxPoints: number | "all";
 *     showPoints?: boolean;
 *     showLegend?: boolean;
 *     showTitle?: boolean;
 *     showGrid?: boolean;
 *     smoothing?: number;
 *     interpolation?: string;
 *     animationStyle?: string;
 *     theme?: string;
 *     distanceUnits?: string;
 * }} options
 */
export function renderSpeedVsDistanceChart(
    container: HTMLElement,
    data: any[],
    options: {
        maxPoints: number | "all";
        showPoints?: boolean;
        showLegend?: boolean;
        showTitle?: boolean;
        showGrid?: boolean;
        smoothing?: number;
        interpolation?: string;
        animationStyle?: string;
        theme?: string;
        distanceUnits?: string;
    }
): void;

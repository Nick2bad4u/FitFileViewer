/**
 * Chart.js plugin to draw subtle background boxes behind legend items.
 * Improves the clickable area for toggling legend visibility.
 *
 * @example
 *     import { chartLegendItemBoxPlugin } from "./utils/charts/plugins/chartLegendItemBoxPlugin.js";
 *     Chart.register(chartLegendItemBoxPlugin);
 *
 * @exports chartLegendItemBoxPlugin
 */
export const chartLegendItemBoxPlugin: {
    id: string;
    beforeDraw: (chart: MinimalChartLike) => void;
};

/**
 * Lightweight chart shape for the legend box plugin.
 */
export type MinimalChartLike = {
    ctx: CanvasRenderingContext2D;
    legend?: {
        legendHitBoxes?: Array<{
            left: number;
            top: number;
            width: number;
            height: number;
        }>;
        legendItems?: Array<{
            hidden?: boolean;
            fillStyle?: string;
            strokeStyle?: string;
        }>;
        options?: {
            display?: boolean;
        };
    };
    options?: {
        plugins?: {
            legend?: {
                display?: boolean;
            };
        };
    };
};

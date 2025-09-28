/**
 * Chart.js plugin to set a theme-aware background color for chart canvases.
 *
 * @namespace chartBackgroundColorPlugin
 * @property {string} id - Plugin identifier
 * @property {Function} beforeDraw - Draws the background color before chart rendering
 *
 * @example
 * import { chartBackgroundColorPlugin } from './utils/chartBackgroundColorPlugin.js';
 * // Register plugin with Chart.js
 * Chart.register(chartBackgroundColorPlugin);
 *
 * // Usage in chart options:
 * plugins: {
 *   chartBackgroundColorPlugin: {
 *     backgroundColor: '#fff' // or use a CSS variable for theme support
 *   }
 * }
 */
/**
 * Lightweight structural JSDoc to avoid heavy chart.js type imports (which were causing TS2307 in checkJs mode).
 * We define the minimal shape we actually rely on instead of importing from the chart.js module.
 * @typedef {Object} MinimalChartLike
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx
 * @property {Object.<string,any>} [options]
 */
/**
 * @typedef {Object} BackgroundColorPluginOptions
 * @property {string} [backgroundColor]
 */
/**
 * Chart.js plugin for setting a theme-aware background color on chart canvases.
 * (Typed minimally to prevent missing module errors.)
 * @type {{ id: string, beforeDraw: (chart: MinimalChartLike, options?: BackgroundColorPluginOptions) => void }}
 * @exports chartBackgroundColorPlugin
 */
export const chartBackgroundColorPlugin: {
    id: string;
    beforeDraw: (chart: MinimalChartLike, options?: BackgroundColorPluginOptions) => void;
};
/**
 * Lightweight structural JSDoc to avoid heavy chart.js type imports (which were causing TS2307 in checkJs mode).
 * We define the minimal shape we actually rely on instead of importing from the chart.js module.
 */
export type MinimalChartLike = {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    options?: {
        [x: string]: any;
    };
};
export type BackgroundColorPluginOptions = {
    backgroundColor?: string;
};
//# sourceMappingURL=chartBackgroundColorPlugin.d.ts.map
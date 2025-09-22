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
export const chartBackgroundColorPlugin = {
    /**
     * Sets the chart background color before drawing chart elements.
     * @param {MinimalChartLike} chart - The chart instance (minimal shape)
     * @param {BackgroundColorPluginOptions} [options] - Plugin options
     */
    beforeDraw: (chart, options) => {
        // Precedence: use backgroundColor from plugin options if provided, otherwise fallback to chart config
        // Use plugin option, then chart config, then fallback to CSS variable or white
        let backgroundColor;
        if (options) {
            ({ backgroundColor } = options);
        }
        if (!backgroundColor) {
            try {
                // Access via bracket notation to satisfy index signature constraints under exactOptionalPropertyTypes
                const pluginCfg =
                    chart?.options && chart.options.plugins && chart.options.plugins.chartBackgroundColorPlugin;
                if (pluginCfg && typeof pluginCfg.backgroundColor === "string") {
                    ({ backgroundColor } = pluginCfg);
                }
            } catch {
                /* Ignore */
            }
        }
        if (!backgroundColor) {
            try {
                const cssBg = chart?.canvas
                    ? getComputedStyle(chart.canvas).getPropertyValue("--bg-primary")?.trim()
                    : "";
                if (cssBg) {
                    backgroundColor = cssBg;
                }
            } catch {
                /* Ignore */
            }
        }
        backgroundColor ||= "#23263a";
        if (!backgroundColor) {
            console.warn("[chartBackgroundColorPlugin] No backgroundColor set, using default #23263a");
            backgroundColor = "#23263a";
        }
        const ctx = chart?.ctx,
            height = chart?.canvas?.height || 0,
            width = chart?.canvas?.width || 0;
        if (!ctx) {
            console.warn("[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw.");
            return;
        }
        // Only log in development mode to avoid noisy output in production
        const w = /** @type {any} */ (globalThis.window === undefined ? undefined : globalThis);
        if (w?.__renderer_dev?.debug) {
            console.log(
                `[chartBackgroundColorPlugin] Drawing background color: ${backgroundColor} (canvas: ${width}x${height})`
            );
        }
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },
    id: "chartBackgroundColorPlugin",
};

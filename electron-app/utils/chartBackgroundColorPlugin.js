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
 * Chart.js plugin for setting a theme-aware background color on chart canvases.
 * @type {import('chart.js').Plugin}
 * @exports chartBackgroundColorPlugin
 */
export const chartBackgroundColorPlugin = {
    id: "chartBackgroundColorPlugin",
    /**
     * Sets the chart background color before drawing chart elements.
     * @param {import('chart.js').Chart} chart - The chart instance
     * @param {Object} [options] - Plugin options
     * @param {string} [options.backgroundColor] - Background color to use
     */
    beforeDraw: (chart, options) => {
        // Precedence: use backgroundColor from plugin options if provided, otherwise fallback to chart config
        // Use plugin option, then chart config, then fallback to CSS variable or white
        let backgroundColor =
            options?.backgroundColor ||
            chart.options?.plugins?.chartBackgroundColorPlugin?.backgroundColor ||
            (() => {
                const cssBg = getComputedStyle(chart.canvas).getPropertyValue("--bg-primary")?.trim();
                return cssBg && cssBg !== "" ? cssBg : undefined;
            })() ||
            "#23263a";
        if (!backgroundColor) {
            console.warn("[chartBackgroundColorPlugin] No backgroundColor set, using default #23263a");
            backgroundColor = "#23263a";
        }
        const { ctx, width, height } = chart;
        if (!ctx) {
            console.warn("[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw.");
            return;
        }
        // Only log in development mode to avoid noisy output in production
        if (window?.__renderer_dev?.debug) {
            console.log(
                `[chartBackgroundColorPlugin] Drawing background color: ${backgroundColor} (canvas: ${width}x${height})`
            );
        }
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },
};

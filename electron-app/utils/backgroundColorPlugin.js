/**
 * Chart.js plugin to set a theme-aware background color for chart canvases.
 *
 * @namespace backgroundColorPlugin
 * @property {string} id - Plugin identifier
 * @property {Function} beforeDraw - Draws the background color before chart rendering
 *
 * @example
 * import { backgroundColorPlugin } from './utils/backgroundColorPlugin.js';
 * // Register plugin with Chart.js
 * Chart.register(backgroundColorPlugin);
 *
 * // Usage in chart options:
 * plugins: {
 *   backgroundColorPlugin: {
 *     backgroundColor: '#fff' // or use a CSS variable for theme support
 *   }
 * }
 */
// Background color plugin for theme-aware chart backgrounds
export const backgroundColorPlugin = {
    id: "backgroundColorPlugin",
    /**
     * Sets the chart background color before drawing chart elements.
     * @param {import('chart.js').Chart} chart - The chart instance
     * @param {Object} [options] - Plugin options
     * @param {string} [options.backgroundColor] - Background color to use
     */
    beforeDraw: (chart, options) => {
        // Precedence: use backgroundColor from plugin options if provided, otherwise fallback to chart config
        const backgroundColor =
            options?.backgroundColor || chart.options?.plugins?.backgroundColorPlugin?.backgroundColor;
        if (!backgroundColor) return;

        const { ctx, width, height } = chart;
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },
};

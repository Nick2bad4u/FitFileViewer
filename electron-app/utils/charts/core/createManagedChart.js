// Centralized helper for creating and registering Chart.js instances
// Ensures all charts participate in the shared _chartjsInstances lifecycle.

/**
 * Create a managed Chart.js instance and register it globally.
 *
 * Callers are responsible for error handling and logging so that messages can
 * remain contextual to the specific chart utility.
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to render into.
 * @param {any} config - Chart.js configuration object.
 *
 * @returns {any} The created Chart instance, or null if Chart is undefined.
 */
export function createManagedChart(canvas, config) {
    const ChartCtor = /** @type {any} */ (globalThis).Chart;
    if (!ChartCtor) {
        // In non-browser/unit-test environments, Chart may be undefined
        return null;
    }

    const chart = new ChartCtor(canvas, config);

    if (chart) {
        if (!Array.isArray(/** @type {any} */ (globalThis)._chartjsInstances)) {
            /** @type {any} */ (globalThis)._chartjsInstances = [];
        }
        /** @type {any} */ (globalThis)._chartjsInstances.push(chart);
    }

    return chart;
}

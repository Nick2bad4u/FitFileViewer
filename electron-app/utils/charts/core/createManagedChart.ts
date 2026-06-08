import { resolveChartRuntime } from "./chartRuntime.js";
import { registerChartInstance } from "./chartInstanceRegistry.js";

/**
 * Configuration passed through to the runtime Chart.js constructor.
 */
export type ManagedChartConfig = Record<string, unknown>;

/**
 * Runtime chart instance tracked by the shared Chart.js lifecycle registry.
 */
export type ManagedChartInstance = object;

type ManagedChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
) => ManagedChartInstance;

function isManagedChartConstructor(
    value: unknown
): value is ManagedChartConstructor {
    return typeof value === "function";
}

/**
 * Create a Chart.js instance and register it in the shared lifecycle registry.
 *
 * @param canvas - Canvas element to render into.
 * @param config - Chart.js configuration object.
 *
 * @returns The created chart instance, or null when Chart.js is not loaded.
 */
export function createManagedChart(
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
): ManagedChartInstance | null {
    const ManagedChartCtor = resolveChartRuntime(isManagedChartConstructor);
    if (!ManagedChartCtor) {
        return null;
    }

    const chart = new ManagedChartCtor(canvas, config);
    registerChartInstance(chart);
    return chart;
}

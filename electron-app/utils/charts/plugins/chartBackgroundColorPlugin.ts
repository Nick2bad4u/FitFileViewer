import { isRendererDebugLoggingEnabled } from "../../debug/rendererDebugLoggingState.js";
import {
    getRendererDebugRuntime,
    type RendererDebugRuntime,
} from "../../debug/rendererDebugRuntime.js";

/**
 * Plugin options accepted by the background color chart plugin.
 */
export interface ChartBackgroundColorPluginOptions {
    backgroundColor?: string;
}

interface ChartBackgroundColorPluginConfig {
    backgroundColor?: string;
}

interface ChartBackgroundColorChartOptions {
    plugins?: {
        chartBackgroundColorPlugin?: ChartBackgroundColorPluginConfig;
    };
}

/**
 * Minimal chart shape required by the background color plugin.
 */
export interface ChartBackgroundColorChart {
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
    options?: ChartBackgroundColorChartOptions;
}

/**
 * Chart.js-compatible background color plugin surface.
 */
export interface ChartBackgroundColorPlugin {
    beforeDraw: (
        chart: ChartBackgroundColorChart,
        options?: ChartBackgroundColorPluginOptions
    ) => void;
    id: "chartBackgroundColorPlugin";
}

export interface ChartBackgroundColorPluginRuntime {
    readonly getRendererDebugRuntime?: (() => RendererDebugRuntime) | undefined;
    readonly isRendererDebugLoggingEnabled?: (() => boolean) | undefined;
}

interface ResolvedChartBackgroundColorPluginRuntime {
    readonly getRendererDebugRuntime: () => RendererDebugRuntime;
    readonly isRendererDebugLoggingEnabled: () => boolean;
}

const DEFAULT_BACKGROUND_COLOR = "#23263a";
const defaultChartBackgroundColorPluginRuntime: ResolvedChartBackgroundColorPluginRuntime =
    {
        getRendererDebugRuntime,
        isRendererDebugLoggingEnabled,
    };

function resolveChartBackgroundColorPluginRuntime(
    runtime: ChartBackgroundColorPluginRuntime
): ResolvedChartBackgroundColorPluginRuntime {
    return {
        getRendererDebugRuntime:
            runtime.getRendererDebugRuntime ??
            defaultChartBackgroundColorPluginRuntime.getRendererDebugRuntime,
        isRendererDebugLoggingEnabled:
            runtime.isRendererDebugLoggingEnabled ??
            defaultChartBackgroundColorPluginRuntime.isRendererDebugLoggingEnabled,
    };
}

function getConfiguredBackgroundColor(
    chart: ChartBackgroundColorChart,
    options?: ChartBackgroundColorPluginOptions
): string | undefined {
    if (typeof options?.backgroundColor === "string") {
        return options.backgroundColor;
    }

    const configuredBackgroundColor =
        chart.options?.plugins?.chartBackgroundColorPlugin?.backgroundColor;

    return typeof configuredBackgroundColor === "string"
        ? configuredBackgroundColor
        : undefined;
}

function getCanvasBackgroundColor(
    canvas: HTMLCanvasElement | undefined
): string | undefined {
    if (!canvas) {
        return undefined;
    }

    try {
        const cssBackgroundColor = getComputedStyle(canvas)
            .getPropertyValue("--bg-primary")
            .trim();

        return cssBackgroundColor || undefined;
    } catch {
        return undefined;
    }
}

function shouldLogDebugMessages(
    runtime: ResolvedChartBackgroundColorPluginRuntime
): boolean {
    return runtime.getRendererDebugRuntime().isRendererDebugLoggingAvailable(
        runtime.isRendererDebugLoggingEnabled()
    );
}

/**
 * Chart.js plugin for painting a theme-aware background before chart elements.
 */
export function createChartBackgroundColorPlugin(
    options: ChartBackgroundColorPluginRuntime = {}
): ChartBackgroundColorPlugin {
    const runtime = resolveChartBackgroundColorPluginRuntime(options);

    return {
        beforeDraw(chart, options) {
            const backgroundColor =
                getConfiguredBackgroundColor(chart, options) ??
                getCanvasBackgroundColor(chart.canvas) ??
                DEFAULT_BACKGROUND_COLOR;

            const { ctx } = chart;
            if (!ctx) {
                console.warn(
                    "[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw."
                );
                return;
            }

            const height = chart.canvas?.height ?? 0,
                width = chart.canvas?.width ?? 0;

            if (shouldLogDebugMessages(runtime)) {
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
}

export const chartBackgroundColorPlugin = createChartBackgroundColorPlugin();

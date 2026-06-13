import { isRendererDebugLoggingEnabled } from "../../debug/rendererDebugLoggingState.js";
import { getRendererDebugRuntime } from "../../debug/rendererDebugRuntime.js";

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

const DEFAULT_BACKGROUND_COLOR = "#23263a";
const rendererDebugRuntime = getRendererDebugRuntime();

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

function shouldLogDebugMessages(): boolean {
    return rendererDebugRuntime.isRendererDebugLoggingAvailable(
        isRendererDebugLoggingEnabled()
    );
}

/**
 * Chart.js plugin for painting a theme-aware background before chart elements.
 */
export const chartBackgroundColorPlugin: ChartBackgroundColorPlugin = {
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

        if (shouldLogDebugMessages()) {
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

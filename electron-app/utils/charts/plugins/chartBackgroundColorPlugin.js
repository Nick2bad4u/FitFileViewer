const DEFAULT_BACKGROUND_COLOR = "#23263a";
function getConfiguredBackgroundColor(chart, options) {
    if (typeof options?.backgroundColor === "string") {
        return options.backgroundColor;
    }
    const configuredBackgroundColor = chart.options?.plugins?.chartBackgroundColorPlugin?.backgroundColor;
    return typeof configuredBackgroundColor === "string"
        ? configuredBackgroundColor
        : undefined;
}
function getCanvasBackgroundColor(canvas) {
    if (!canvas) {
        return undefined;
    }
    try {
        const cssBackgroundColor = getComputedStyle(canvas)
            .getPropertyValue("--bg-primary")
            .trim();
        return cssBackgroundColor || undefined;
    }
    catch {
        return undefined;
    }
}
function shouldLogDebugMessages() {
    const rendererGlobal = globalThis;
    return (globalThis.window !== undefined &&
        rendererGlobal.__renderer_dev?.debug === true);
}
/**
 * Chart.js plugin for painting a theme-aware background before chart elements.
 */
export const chartBackgroundColorPlugin = {
    beforeDraw(chart, options) {
        const backgroundColor = getConfiguredBackgroundColor(chart, options) ??
            getCanvasBackgroundColor(chart.canvas) ??
            DEFAULT_BACKGROUND_COLOR;
        const { ctx } = chart;
        if (!ctx) {
            console.warn("[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw.");
            return;
        }
        const height = chart.canvas?.height ?? 0, width = chart.canvas?.width ?? 0;
        if (shouldLogDebugMessages()) {
            console.log(`[chartBackgroundColorPlugin] Drawing background color: ${backgroundColor} (canvas: ${width}x${height})`);
        }
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },
    id: "chartBackgroundColorPlugin",
};

import { isObjectRecord } from "./renderChartModuleHelpers.js";
function normalizeRenderOptions(options) {
    return isObjectRecord(options) ? options : {};
}
function readBooleanOption(options, optionName) {
    return options[optionName] === undefined
        ? false
        : Boolean(options[optionName]);
}
/**
 * Captures per-call chart data render flags and validates DOM write capability.
 *
 * @param dependencies - Runtime probes and environment accessors for the render
 *   pass.
 * @param options - Caller-provided render options.
 *
 * @returns Normalized render context used by the chart data pipeline.
 */
export function beginChartDataRenderContext(dependencies, options) {
    const renderOptions = normalizeRenderOptions(options);
    // Keep this preflight early so mocked DOM failures surface through the outer render path.
    dependencies.doc.createElement("div");
    return {
        isDebugLoggingEnabled:
            dependencies.isDevelopmentEnvironment() &&
            dependencies.isChartDebugEnabled(),
        isTestRuntime: dependencies.isTestEnvironment(),
        renderStartTime: dependencies.nowPerformance(),
        skipControls: readBooleanOption(renderOptions, "skipControls"),
        skipTabAbort: readBooleanOption(renderOptions, "skipTabAbort"),
    };
}

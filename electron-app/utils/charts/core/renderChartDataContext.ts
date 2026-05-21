interface BeginChartDataRenderContextDependencies {
    readonly doc: Pick<Document, "createElement">;
    readonly isChartDebugEnabled: () => boolean;
    readonly isDevelopmentEnvironment: () => boolean;
    readonly isTestEnvironment: () => boolean;
    readonly nowPerformance: () => number;
}

/**
 * Normalized per-call chart data render flags.
 */
export interface ChartDataRenderContext {
    readonly isDebugLoggingEnabled: boolean;
    readonly isTestRuntime: boolean;
    readonly renderStartTime: number;
    readonly skipControls: boolean;
    readonly skipTabAbort: boolean;
}

function normalizeRenderOptions(
    options: unknown
): Readonly<Record<string, unknown>> {
    return options !== null && typeof options === "object"
        ? (options as Readonly<Record<string, unknown>>)
        : {};
}

function readBooleanOption(
    options: Readonly<Record<string, unknown>>,
    optionName: string
): boolean {
    return options[optionName] === undefined
        ? false
        : Boolean(options[optionName]);
}

/**
 * Captures per-call chart data render flags and validates DOM write capability.
 *
 * @param dependencies - Runtime probes and environment accessors for the render pass.
 * @param options - Caller-provided render options.
 * @returns Normalized render context used by the chart data pipeline.
 */
export function beginChartDataRenderContext(
    dependencies: BeginChartDataRenderContextDependencies,
    options: unknown
): ChartDataRenderContext {
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

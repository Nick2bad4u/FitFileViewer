interface ComputedStateAccess {
    invalidateComputed?(key: string): unknown;
}

interface RenderedEventDependencies {
    CustomEventConstructor: typeof CustomEvent | undefined;
    doc: Document;
    getState(path: string): unknown;
    now(): number;
}

interface RenderCompletionStateDependencies extends RenderedEventDependencies {
    emitChartsRenderedEvent(
        dependencies: RenderedEventDependencies,
        summary: RenderCompletionStateSummary
    ): void;
    getComputedStateManager(): ComputedStateAccess;
    updatePreviousChartState(
        chartCount: number,
        visibleFields: number,
        timestamp: number
    ): unknown;
}

interface RenderCompletionStateSummary {
    readonly renderTime: number;
    readonly totalChartsRendered: number;
    readonly visibleFieldCount: number;
}

function invalidateChartsSummary(
    getComputedStateManager: () => ComputedStateAccess
): void {
    try {
        getComputedStateManager().invalidateComputed?.("charts.summary");
    } catch {
        // Ignore computed-state failures in injected test environments.
    }
}

/**
 * Updates state and emits the browser event after chart rendering completes.
 */
export function completeChartRenderState(
    dependencies: RenderCompletionStateDependencies,
    summary: RenderCompletionStateSummary
): void {
    dependencies.updatePreviousChartState(
        summary.totalChartsRendered,
        summary.visibleFieldCount,
        dependencies.now()
    );

    dependencies.emitChartsRenderedEvent(
        {
            CustomEventConstructor: dependencies.CustomEventConstructor,
            doc: dependencies.doc,
            getState: (path) => dependencies.getState(path),
            now: () => dependencies.now(),
        },
        summary
    );

    invalidateChartsSummary(() => dependencies.getComputedStateManager());
}

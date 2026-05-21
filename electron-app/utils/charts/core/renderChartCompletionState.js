function invalidateChartsSummary(getComputedStateManager) {
    try {
        getComputedStateManager().invalidateComputed?.("charts.summary");
    } catch {
        // Ignore computed-state compatibility failures.
    }
}
/**
 * Updates state and emits the browser event after chart rendering completes.
 */
export function completeChartRenderState(dependencies, summary) {
    dependencies.updatePreviousChartState(
        summary.totalChartsRendered,
        summary.visibleFieldCount,
        dependencies.now()
    );
    dependencies.emitChartsRenderedEvent(
        {
            CustomEventConstructor: dependencies.CustomEventConstructor,
            doc: dependencies.doc,
            getState: dependencies.getState,
            now: dependencies.now,
        },
        summary
    );
    invalidateChartsSummary(dependencies.getComputedStateManager);
}

import { getRecordValue } from "./renderChartModuleHelpers.js";
function hasRenderableGlobalData(getState) {
    const globalData = getState("globalData");
    const recordMesgs = getRecordValue(globalData, "recordMesgs");
    return Array.isArray(recordMesgs) && recordMesgs.length > 0;
}
/**
 * Emits the chart-rendered status event consumed by chart status UI.
 */
export function emitChartsRenderedEvent(dependencies, summary) {
    const EventConstructor = dependencies.CustomEventConstructor;
    if (typeof EventConstructor !== "function") {
        return;
    }
    try {
        const chartsRenderedEvent = new EventConstructor("chartsRendered", {
            detail: {
                hasData: hasRenderableGlobalData(dependencies.getState),
                renderTime: summary.renderTime,
                settings: dependencies.getState("charts.chartOptions"),
                timestamp: dependencies.now(),
                totalRendered: summary.totalChartsRendered,
                visibleFields: summary.visibleFieldCount,
            },
        });
        dependencies.doc.dispatchEvent(chartsRenderedEvent);
    }
    catch {
        /* ignore non-browser CustomEvent issues */
    }
}

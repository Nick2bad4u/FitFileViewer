import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";

interface RenderedEventDependencies {
    CustomEventConstructor: typeof CustomEvent | undefined;
    doc: Document;
    getState(path: string): unknown;
    now(): number;
}

interface RenderedEventSummary {
    renderTime: number;
    totalChartsRendered: number;
    visibleFieldCount: number;
}

function hasRenderableGlobalData(getState: (path: string) => unknown): boolean {
    return hasChartDataRecordMessages(getState("globalData"));
}

/**
 * Emits the chart-rendered status event consumed by chart status UI.
 */
export function emitChartsRenderedEvent(
    dependencies: RenderedEventDependencies,
    summary: RenderedEventSummary
): void {
    const EventConstructor = dependencies.CustomEventConstructor;
    if (typeof EventConstructor !== "function") {
        return;
    }

    try {
        const chartsRenderedEvent = new EventConstructor("chartsRendered", {
            detail: {
                hasData: hasRenderableGlobalData((path) =>
                    dependencies.getState(path)
                ),
                renderTime: summary.renderTime,
                settings: dependencies.getState("charts.chartOptions"),
                timestamp: dependencies.now(),
                totalRendered: summary.totalChartsRendered,
                visibleFields: summary.visibleFieldCount,
            },
        });
        dependencies.doc.dispatchEvent(chartsRenderedEvent);
    } catch {
        /* ignore non-browser CustomEvent issues */
    }
}

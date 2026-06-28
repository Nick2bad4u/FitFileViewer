import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";

interface RenderedEventDependencies {
    CustomEventConstructor: typeof CustomEvent | undefined;
    doc: Document;
    getChartOptions(): unknown;
    now(): number;
}

interface RenderedEventSummary {
    renderTime: number;
    totalChartsRendered: number;
    visibleFieldCount: number;
}

function hasRenderableActiveFitChartData(): boolean {
    return hasActiveFitChartData();
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
                hasData: hasRenderableActiveFitChartData(),
                renderTime: summary.renderTime,
                settings: dependencies.getChartOptions(),
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

interface ChartRequestListenerGlobal {
    _fitFileViewerChartListenerAbortController?: AbortController;
    _fitFileViewerChartListener?: unknown;
}

interface ChartRequestStateManager {
    debouncedRender(reason: string): void;
}

interface RegisterChartRequestListenerParams {
    chartGlobal: ChartRequestListenerGlobal;
    getChartStateManager(): ChartRequestStateManager | null;
    renderChart(container: HTMLElement): Promise<unknown> | unknown;
}

function getRequestReason(event: Event): string {
    return event instanceof CustomEvent && event.detail?.reason
        ? String(event.detail.reason)
        : "event-trigger";
}

function getFallbackChartContainer(): HTMLElement {
    return (
        document.querySelector<HTMLElement>("#chartjs_chart_container") ??
        document.querySelector<HTMLElement>("#content_chartjs") ??
        document.querySelector<HTMLElement>("#content_chart") ??
        document.body
    );
}

/**
 * Registers the legacy chart render request bridge once per renderer runtime.
 *
 * @param params - Runtime dependencies supplied by renderChartJS.
 */
export function registerChartRequestListener({
    chartGlobal,
    getChartStateManager,
    renderChart,
}: RegisterChartRequestListenerParams): void {
    if (chartGlobal._fitFileViewerChartListener) {
        return;
    }

    chartGlobal._fitFileViewerChartListener = true;
    chartGlobal._fitFileViewerChartListenerAbortController =
        new AbortController();

    console.log(
        "[ChartJS] Chart state management is now handled by chartStateManager"
    );
    console.log(
        "[ChartJS] Old event-based system is being phased out in favor of reactive state"
    );

    try {
        globalThis.addEventListener(
            "ffv:request-render-charts",
            (event: Event) => {
                const reason = getRequestReason(event);
                console.log(
                    `[ChartJS] Received render request event: ${reason}`
                );

                const chartStateManager = getChartStateManager();
                if (chartStateManager) {
                    chartStateManager.debouncedRender(reason);
                    return;
                }

                const container = getFallbackChartContainer();
                void Promise.resolve()
                    .then(() => renderChart(container))
                    .catch((error: unknown) => {
                        console.warn(
                            "[ChartJS] Event-based render fallback failed:",
                            error
                        );
                    });
            },
            {
                signal: chartGlobal._fitFileViewerChartListenerAbortController
                    .signal,
            }
        );
    } catch (listenerError) {
        console.warn(
            "[ChartJS] Failed to register render request listener:",
            listenerError
        );
    }
}

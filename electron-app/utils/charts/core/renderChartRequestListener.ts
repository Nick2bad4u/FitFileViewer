import {
    isChartRequestListenerRegistered,
    registerChartRequestListenerController,
} from "./chartListenerState.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
import {
    getRenderChartRequestListenerRuntime,
    type RenderChartRequestListenerRuntime,
} from "./renderChartRequestListenerRuntime.js";

interface ChartRequestStateManager {
    debouncedRender(reason: string): void;
}

interface RegisterChartRequestListenerParams {
    getChartStateManager(): ChartRequestStateManager | null;
    renderChart(container: HTMLElement): unknown;
    runtime?: RenderChartRequestListenerRuntime | undefined;
}

function getRequestReason(
    event: Event,
    runtime: RenderChartRequestListenerRuntime
): string {
    if (!runtime.isCustomEvent(event) || !isObjectRecord(event.detail)) {
        return "event-trigger";
    }

    const reason = event.detail["reason"];
    return typeof reason === "string" ||
        typeof reason === "number" ||
        typeof reason === "boolean"
        ? String(reason)
        : "event-trigger";
}

/**
 * Registers the chart render request listener once per renderer runtime.
 *
 * @param params - Chart rendering dependencies supplied by renderChartJS.
 */
export function registerChartRequestListener(
    params: RegisterChartRequestListenerParams
): void {
    if (isChartRequestListenerRegistered()) {
        return;
    }

    const runtime =
        params.runtime ?? getRenderChartRequestListenerRuntime();
    const signal = registerChartRequestListenerController();

    console.log(
        "[ChartJS] Chart render requests use chartStateManager when available"
    );
    console.log(
        "[ChartJS] Event listener fallback remains available for chart render requests"
    );

    try {
        runtime.addChartRequestListener(
            (event: Event) => {
                const reason = getRequestReason(event, runtime);
                console.log(
                    `[ChartJS] Received render request event: ${reason}`
                );

                const chartStateManager = params.getChartStateManager();
                if (chartStateManager) {
                    chartStateManager.debouncedRender(reason);
                    return;
                }

                void Promise.resolve()
                    .then(() =>
                        params.renderChart(
                            runtime.getFallbackChartContainer()
                        )
                    )
                    .catch((error: unknown) => {
                        console.warn(
                            "[ChartJS] Event-based render fallback failed:",
                            error
                        );
                    });
            },
            {
                signal,
            }
        );
    } catch (listenerError) {
        console.warn(
            "[ChartJS] Failed to register render request listener:",
            listenerError
        );
    }
}

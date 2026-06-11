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
 * Registers the legacy chart render request bridge once per renderer runtime.
 *
 * @param params - Runtime dependencies supplied by renderChartJS.
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
        "[ChartJS] Chart state management is now handled by chartStateManager"
    );
    console.log(
        "[ChartJS] Old event-based system is being phased out in favor of reactive state"
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

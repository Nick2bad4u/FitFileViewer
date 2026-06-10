import {
    isChartRequestListenerRegistered,
    registerChartRequestListenerController,
} from "./chartListenerState.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

interface ChartRequestStateManager {
    debouncedRender(reason: string): void;
}

interface RegisterChartRequestListenerParams {
    getChartStateManager(): ChartRequestStateManager | null;
    renderChart(container: HTMLElement): unknown;
}

function getRequestReason(event: Event): string {
    if (!(event instanceof CustomEvent) || !isObjectRecord(event.detail)) {
        return "event-trigger";
    }

    const reason = event.detail["reason"];
    return typeof reason === "string" ||
        typeof reason === "number" ||
        typeof reason === "boolean"
        ? String(reason)
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
export function registerChartRequestListener(
    params: RegisterChartRequestListenerParams
): void {
    if (isChartRequestListenerRegistered()) {
        return;
    }

    const signal = registerChartRequestListenerController();

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

                const chartStateManager = params.getChartStateManager();
                if (chartStateManager) {
                    chartStateManager.debouncedRender(reason);
                    return;
                }

                const container = getFallbackChartContainer();
                void Promise.resolve()
                    .then(() => params.renderChart(container))
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

import { debounce } from "./renderChartDebounce.js";

interface StateManager {
    getState(path: string): unknown;
}

interface CreateDebouncedDirectRerenderDependencies {
    getStateManager(): StateManager;
    isDevelopmentEnvironment(): boolean;
    renderChart(targetContainer: HTMLElement): Promise<unknown>;
    waitMs: number;
}

function getChartContainer(): Element | null {
    if (typeof document === "undefined") {
        return null;
    }

    return (
        document.querySelector("#chartjs_chart_container") ||
        document.querySelector("#content_chartjs") ||
        document.querySelector("#content_chart")
    );
}

function hasRecordMessages(value: unknown): value is { recordMesgs: unknown[] } {
    return (
        value !== null &&
        typeof value === "object" &&
        Array.isArray((value as { recordMesgs?: unknown }).recordMesgs)
    );
}

/**
 * Creates the stable debounced direct re-render fallback used when the chart
 * state manager is unavailable.
 *
 * @param dependencies - Runtime state, environment, and render callback hooks.
 * @returns Debounced direct re-render scheduler.
 */
export function createDebouncedDirectRerender(
    dependencies: CreateDebouncedDirectRerenderDependencies
): (reason?: string) => void {
    return debounce((reason = "State change") => {
        const container = getChartContainer();
        const { getState } = dependencies.getStateManager();
        const data = getState("globalData");
        const hasValidData =
            hasRecordMessages(data) && data.recordMesgs.length > 0;

        if (container && hasValidData) {
            void dependencies
                .renderChart(container as HTMLElement)
                .catch((error: unknown) => {
                    console.warn("[ChartJS] Direct re-render failed", error);
                });
            return;
        }

        if (dependencies.isDevelopmentEnvironment()) {
            console.log(
                `[ChartJS] Skipping direct re-render (${reason}) - no container or no data`
            );
        }
    }, dependencies.waitMs);
}

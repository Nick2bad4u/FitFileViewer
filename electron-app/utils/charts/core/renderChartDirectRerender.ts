import { debounce } from "./renderChartDebounce.js";
import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";

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

/**
 * Creates the stable debounced direct re-render fallback used when the chart
 * state manager is unavailable.
 *
 * @param dependencies - Runtime state, environment, and render callback hooks.
 *
 * @returns Debounced direct re-render scheduler.
 */
export function createDebouncedDirectRerender(
    dependencies: CreateDebouncedDirectRerenderDependencies
): (reason?: string) => void {
    return debounce((reason = "State change") => {
        const container = getChartContainer();
        const stateManager = dependencies.getStateManager();
        const data = stateManager.getState("globalData");
        const hasValidData = hasChartDataRecordMessages(data);

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

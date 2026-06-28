import { debounce } from "./renderChartDebounce.js";
import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";
import {
    getRenderChartDirectRerenderRuntime,
    type RenderChartDirectRerenderRuntime,
} from "./renderChartDirectRerenderRuntime.js";

interface CreateDebouncedDirectRerenderDependencies {
    isDevelopmentEnvironment(): boolean;
    renderChart(targetContainer: HTMLElement): Promise<unknown>;
    runtime?: RenderChartDirectRerenderRuntime | undefined;
    waitMs: number;
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
    const runtime =
        dependencies.runtime ?? getRenderChartDirectRerenderRuntime();

    return debounce((reason = "State change") => {
        const container = runtime.queryChartContainer();
        const hasValidData = hasActiveFitChartData();

        if (container && hasValidData) {
            void dependencies
                .renderChart(container)
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

import type {
    ActivityStartTime,
    ChartDataRecord,
} from "./renderChartDataPreparation.js";

interface ChartRenderOptions {
    skipControls: boolean;
    skipTabAbort: boolean;
}

type RenderChartsWithData = (
    targetContainer: unknown,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime,
    options: ChartRenderOptions
) => Promise<unknown>;

interface RunChartRenderDependencies {
    renderChartsWithData: RenderChartsWithData;
    warn(message: string, error: unknown): void;
}

/**
 * Runs the chart renderer and preserves the graceful-completion fallback.
 */
export async function runChartRender(
    dependencies: RunChartRenderDependencies,
    targetContainer: unknown,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime,
    options: ChartRenderOptions
): Promise<boolean> {
    try {
        return (
            (await dependencies.renderChartsWithData(
                targetContainer,
                recordMesgs,
                activityStartTime,
                options
            )) === true
        );
    } catch (error) {
        dependencies.warn(
            "[ChartJS] renderChartsWithData threw, continuing with graceful completion:",
            error
        );
        return recordMesgs.length > 0;
    }
}

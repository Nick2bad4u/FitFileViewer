import { touchChartRenderDependencies } from "./renderChartDependencyTouches.js";
import { renderNoChartDataPlaceholder } from "./renderChartPlaceholders.js";
import {
    type ChartDataRecord,
    type ChartDataRecordSource,
    isChartDataObject,
    storeChartData,
} from "./renderChartDataPreparation.js";
import type { ChartStateUpdateOptions } from "./renderChartStateAccess.js";
import {
    getActiveFitChartData,
    type FitChartActivityStartTime,
} from "../../state/domain/fitChartDataState.js";

type UnitConverter = (value: number, field: string) => unknown;
type NotifyFunction = (message: string, type: "info" | "warning") => unknown;
type SetupZoneDataFunction = (
    activityData: ChartDataRecord | ChartDataRecordSource
) => unknown;

interface ChartRenderDataReadinessDependencies {
    doc: Document;
    getConverters(): UnitConverter;
    getSetupZoneData(): SetupZoneDataFunction;
    getThemeConfig(): unknown;
    notify: NotifyFunction;
    safeCompleteRendering(success: boolean): void;
    setChartData(value: unknown, options?: ChartStateUpdateOptions): void;
}

interface ChartRenderDataReadinessInput {
    targetContainer: unknown;
}

/** Result of validating and preparing chart render data. */
export type ChartRenderDataReadinessResult =
    | {
          ready: false;
      }
    | {
          activityStartTime: FitChartActivityStartTime;
          ready: true;
          recordMesgs: ChartDataRecord[];
      };

async function completeMissingChartData(
    dependencies: ChartRenderDataReadinessDependencies,
    input: ChartRenderDataReadinessInput
): Promise<ChartRenderDataReadinessResult> {
    console.warn("[ChartJS] No record messages found in FIT data");
    await dependencies.notify(
        "No chartable data found in this FIT file",
        "info"
    );

    await renderNoChartDataPlaceholder(
        {
            doc: dependencies.doc,
            getThemeConfig: () => dependencies.getThemeConfig(),
        },
        input.targetContainer
    );
    dependencies.safeCompleteRendering(false);
    return { ready: false };
}

/**
 * Validates chart input data and prepares the record-message payload.
 *
 * @param dependencies - State, setup, notification, and DOM dependencies.
 * @param input - Target container used for no-data placeholder rendering.
 *
 * @returns Prepared record messages when chart rendering should continue.
 */
export async function prepareChartRenderData(
    dependencies: ChartRenderDataReadinessDependencies,
    input: ChartRenderDataReadinessInput
): Promise<ChartRenderDataReadinessResult> {
    const chartData = getActiveFitChartData();
    if (!isChartDataObject(chartData.rawData)) {
        console.warn("[ChartJS] No FIT file data available for charts");
        await dependencies.notify(
            "No FIT file data available for chart rendering",
            "warning"
        );
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }

    const setup = dependencies.getSetupZoneData();
    setup(chartData.rawData);

    await touchChartRenderDependencies({
        getConverters: () => dependencies.getConverters(),
        getThemeConfig: () => dependencies.getThemeConfig(),
    });

    if (!chartData.ready) {
        return completeMissingChartData(dependencies, input);
    }

    console.log(
        `[ChartJS] Found ${chartData.totalDataPoints} data points to process`
    );

    const activityStartTime = chartData.activityStartTime;
    if (activityStartTime !== null) {
        console.log("[ChartJS] Activity start time:", activityStartTime);
    }

    storeChartData(
        {
            setChartData: (value, options) =>
                dependencies.setChartData(value, options),
        },
        chartData.recordMesgs,
        activityStartTime
    );

    return {
        activityStartTime,
        ready: true,
        recordMesgs: chartData.recordMesgs,
    };
}

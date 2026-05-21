import { touchChartRenderDependencies } from "./renderChartDependencyTouches.js";
import { renderNoChartDataPlaceholder } from "./renderChartPlaceholders.js";
import {
    type ActivityStartTime,
    type ChartDataRecord,
    type ChartDataRecordSource,
    getActivityStartTime,
    getRecordMessages,
    isChartDataObject,
    storeChartData,
} from "./renderChartDataPreparation.js";
import type { StateUpdateOptions } from "../../state/core/stateManager.js";

type UnitConverter = (value: number, field: string) => unknown;
type NotifyFunction = (
    message: string,
    type: "info" | "warning"
) => Promise<unknown> | unknown;
type SetStateFunction = (
    path: string,
    value: unknown,
    options?: StateUpdateOptions
) => void;
type SetupZoneDataFunction = (
    globalData: ChartDataRecord | ChartDataRecordSource
) => unknown;

interface ChartStateManagerAccess {
    setState: SetStateFunction;
}

interface ChartRenderDataReadinessDependencies {
    doc: Document;
    getConverters(): UnitConverter;
    getState(path: string): unknown;
    getStateManager(): ChartStateManagerAccess;
    getSetupZoneData(): SetupZoneDataFunction;
    getThemeConfig(): Promise<unknown> | unknown;
    notify: NotifyFunction;
    safeCompleteRendering(success: boolean): void;
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
          activityStartTime: ActivityStartTime;
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
            getThemeConfig: async () => dependencies.getThemeConfig(),
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
    const firstGlobalData = dependencies.getState("globalData");
    if (!isChartDataObject(firstGlobalData)) {
        console.warn("[ChartJS] No FIT file data available for charts");
        await dependencies.notify(
            "No FIT file data available for chart rendering",
            "warning"
        );
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }

    const globalData = dependencies.getState("globalData");
    if (!isChartDataObject(globalData)) {
        console.warn("[ChartJS] No FIT file data available for charts");
        await dependencies.notify(
            "No FIT file data available for chart rendering",
            "warning"
        );
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }

    const setup = dependencies.getSetupZoneData();
    setup(globalData);

    await touchChartRenderDependencies({
        getConverters: dependencies.getConverters,
        getThemeConfig: dependencies.getThemeConfig,
    });

    const recordMesgs = getRecordMessages(globalData);
    if (!recordMesgs) {
        return completeMissingChartData(dependencies, input);
    }

    console.log(`[ChartJS] Found ${recordMesgs.length} data points to process`);

    const activityStartTime = getActivityStartTime(recordMesgs);
    if (activityStartTime != null) {
        console.log("[ChartJS] Activity start time:", activityStartTime);
    }

    storeChartData(
        { setState: dependencies.getStateManager().setState },
        recordMesgs,
        activityStartTime
    );

    return {
        activityStartTime,
        ready: true,
        recordMesgs,
    };
}

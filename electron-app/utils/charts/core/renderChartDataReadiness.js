import { touchChartRenderDependencies } from "./renderChartDependencyTouches.js";
import { renderNoChartDataPlaceholder } from "./renderChartPlaceholders.js";
import { getActivityStartTime, getRecordMessages, isChartDataObject, storeChartData, } from "./renderChartDataPreparation.js";
async function completeMissingChartData(dependencies, input) {
    console.warn("[ChartJS] No record messages found in FIT data");
    await dependencies.notify("No chartable data found in this FIT file", "info");
    await renderNoChartDataPlaceholder({
        doc: dependencies.doc,
        getThemeConfig: async () => dependencies.getThemeConfig(),
    }, input.targetContainer);
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
export async function prepareChartRenderData(dependencies, input) {
    const firstGlobalData = dependencies.getState("globalData");
    if (!isChartDataObject(firstGlobalData)) {
        console.warn("[ChartJS] No FIT file data available for charts");
        await dependencies.notify("No FIT file data available for chart rendering", "warning");
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }
    const globalData = dependencies.getState("globalData");
    if (!isChartDataObject(globalData)) {
        console.warn("[ChartJS] No FIT file data available for charts");
        await dependencies.notify("No FIT file data available for chart rendering", "warning");
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
    storeChartData({ setState: dependencies.getStateManager().setState }, recordMesgs, activityStartTime);
    return {
        activityStartTime,
        ready: true,
        recordMesgs,
    };
}

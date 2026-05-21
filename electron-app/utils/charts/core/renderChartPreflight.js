import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
/**
 * Normalizes caller-provided render options to explicit booleans.
 */
export function normalizeRenderChartOptions(options) {
    const {
        allowInactiveTab = false,
        skipControls = false,
        skipTabAbort = false,
    } = isObjectRecord(options) ? options : {};
    return {
        allowInactiveTab: Boolean(allowInactiveTab),
        skipControls: Boolean(skipControls),
        skipTabAbort: Boolean(skipTabAbort),
    };
}
/**
 * Returns true when chart rendering should be skipped for an inactive tab.
 */
export function shouldAbortInactiveChartRender(dependencies, allowInactiveTab) {
    if (dependencies.isTestEnvironment() || allowInactiveTab) {
        return false;
    }
    const { getState } = dependencies.getStateManager();
    const activeTab = getState("ui.activeTab");
    if (activeTab === "chart" || activeTab === "chartjs") {
        return false;
    }
    dependencies.log(
        `[ChartJS] Skipping render - chart tab not active (current tab: ${String(activeTab)})`
    );
    return true;
}
/**
 * Touches a string target ID early so legacy DOM access expectations are
 * preserved.
 */
export function touchStringTargetContainer(doc, targetContainer) {
    if (typeof targetContainer !== "string") {
        return;
    }
    try {
        const normalizedId = targetContainer.startsWith("#")
            ? targetContainer.slice(1)
            : targetContainer;
        getElementByIdFlexible(doc, normalizedId);
    } catch {
        /* ignore */
    }
}
/**
 * Checks the legacy Chart.js unavailable sentinels used by the renderer.
 */
export function isChartLibraryUnavailable(chartGlobal) {
    return chartGlobal.Chart === null || chartGlobal.Chart === false;
}

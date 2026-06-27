import { isRendererChartTab } from "../../state/domain/rendererActiveTabState.js";
import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

interface NormalizedRenderChartOptions {
    allowInactiveTab: boolean;
    skipControls: boolean;
    skipTabAbort: boolean;
}

interface StateAccessor {
    getState(path: string): unknown;
}

interface InactiveTabDependencies {
    getStateManager(): StateAccessor;
    isTestEnvironment(): boolean;
    log(message: string): void;
}

/**
 * Normalizes caller-provided render options to explicit booleans.
 */
export function normalizeRenderChartOptions(
    options: unknown
): NormalizedRenderChartOptions {
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
export function shouldAbortInactiveChartRender(
    dependencies: InactiveTabDependencies,
    allowInactiveTab: boolean
): boolean {
    if (dependencies.isTestEnvironment() || allowInactiveTab) {
        return false;
    }

    const stateManager = dependencies.getStateManager();
    const activeTab = stateManager.getState("ui.activeTab");
    if (isRendererChartTab(activeTab)) {
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
export function touchStringTargetContainer(
    doc: Document,
    targetContainer: unknown
): void {
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

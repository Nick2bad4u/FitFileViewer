import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";

interface RenderChartOptionsInput {
    allowInactiveTab?: boolean;
    skipControls?: boolean;
    skipTabAbort?: boolean;
}

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

interface ChartRuntimeGlobal {
    Chart?: unknown;
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
    } =
        options !== null && typeof options === "object"
            ? (options as RenderChartOptionsInput)
            : {};

    return { allowInactiveTab, skipControls, skipTabAbort };
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
 * Touches a string target ID early so legacy DOM access expectations are preserved.
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

/**
 * Checks the legacy Chart.js unavailable sentinels used by the renderer.
 */
export function isChartLibraryUnavailable(
    chartGlobal: ChartRuntimeGlobal
): boolean {
    return chartGlobal.Chart === null || chartGlobal.Chart === false;
}

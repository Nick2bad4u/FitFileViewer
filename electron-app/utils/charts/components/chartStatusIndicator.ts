import { subscribeToChartSettings } from "../../state/domain/settingsStateManager.js";
import { subscribeToActiveFitRawData } from "../../state/domain/activeFitRawDataState.js";
import { getChartCounts } from "../core/getChartCounts.js";
import { createChartStatusIndicator } from "./createChartStatusIndicator.js";
import {
    cleanupChartStatusIndicatorFromCounts,
    createChartStatusIndicatorFromCounts,
} from "./createChartStatusIndicatorFromCounts.js";
import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";
import {
    cleanupGlobalChartStatusIndicatorFromCounts,
    createGlobalChartStatusIndicatorFromCounts,
} from "./createGlobalChartStatusIndicatorFromCounts.js";
import {
    type ChartStatusIndicatorRuntime,
    type ChartStatusIndicatorTimerHandle,
    getChartStatusIndicatorRuntime,
} from "./chartStatusIndicatorRuntime.js";

const pendingStatusTimeouts = new Set<ChartStatusIndicatorTimerHandle>();
const setupSubscriptions = new Set<() => void>();

let setupController: AbortController | null = null;

function clearPendingStatusTimeouts(): void {
    const runtime = getChartStatusIndicatorRuntime();
    for (const timeoutId of pendingStatusTimeouts) {
        runtime.clearTimeout(timeoutId);
    }
    pendingStatusTimeouts.clear();
}

function clearSetupSubscriptions(): void {
    for (const unsubscribe of setupSubscriptions) {
        try {
            unsubscribe();
        } catch {
            /* ignore */
        }
    }
    setupSubscriptions.clear();
}

function trackSetupSubscription(unsubscribe: unknown): void {
    if (typeof unsubscribe === "function") {
        setupSubscriptions.add(unsubscribe as () => void);
    }
}

function scheduleChartStatusWork(
    delayMs: number,
    errorMessage: string,
    callback: () => void,
    runtime: ChartStatusIndicatorRuntime = getChartStatusIndicatorRuntime()
): void {
    const timeoutRef: { id?: ChartStatusIndicatorTimerHandle } = {};
    const runState = { didRun: false };
    timeoutRef.id = runtime.setTimeout(() => {
        runState.didRun = true;
        if (timeoutRef.id !== undefined) {
            pendingStatusTimeouts.delete(timeoutRef.id);
        }
        try {
            return callback();
        } catch (error) {
            console.error(errorMessage, error);
        }
        return undefined;
    }, delayMs);

    if (!runState.didRun) {
        pendingStatusTimeouts.add(timeoutRef.id);
    }
}

function scheduleIndicatorRefresh(
    errorMessage: string,
    delayMs = 50,
    runtime: ChartStatusIndicatorRuntime = getChartStatusIndicatorRuntime()
): void {
    scheduleChartStatusWork(
        delayMs,
        errorMessage,
        () => {
            updateAllChartStatusIndicators();
        },
        runtime
    );
}

function replaceIndicator(
    selector: string,
    createReplacement: () => HTMLElement | null,
    cleanupCurrentIndicator?: (indicator: HTMLElement) => void,
    runtime: ChartStatusIndicatorRuntime = getChartStatusIndicatorRuntime()
): boolean {
    const currentIndicator = runtime.querySelector(selector);
    if (!currentIndicator) {
        return false;
    }

    const newIndicator = createReplacement();
    if (
        newIndicator &&
        runtime.isHTMLElement(currentIndicator) &&
        currentIndicator.parentNode
    ) {
        cleanupCurrentIndicator?.(currentIndicator);
        currentIndicator.replaceWith(newIndicator);
    }

    return true;
}

/**
 * Set up automatic chart status indicator updates.
 */
export function setupChartStatusUpdates(): void {
    try {
        setupController?.abort();
        clearPendingStatusTimeouts();
        clearSetupSubscriptions();
        const runtime = getChartStatusIndicatorRuntime();
        setupController = runtime.createAbortController();
        const { signal } = setupController;

        trackSetupSubscription(
            subscribeToChartSettings(() => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in chart settings handler:",
                    50,
                    runtime
                );
            })
        );
        trackSetupSubscription(
            subscribeToActiveFitRawData(() => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in fitFile.rawData state handler:",
                    100,
                    runtime
                );
            })
        );

        runtime.addFieldToggleChangedListener(
            () => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in fieldToggleChanged handler:",
                    50,
                    runtime
                );
            },
            { signal }
        );

        runtime.addChartsRenderedListener(
            () => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in chartsRendered handler:",
                    50,
                    runtime
                );
            },
            { signal }
        );

        scheduleChartStatusWork(
            100,
            "[ChartStatus] Error creating initial global indicator:",
            () => {
                createGlobalChartStatusIndicator();
            },
            runtime
        );
    } catch (error) {
        console.error(
            "[ChartStatus] Error setting up chart status updates:",
            error
        );
    }
}

/**
 * Update both settings and global chart status indicators synchronously.
 */
export function updateAllChartStatusIndicators(): void {
    try {
        const runtime = getChartStatusIndicatorRuntime();
        const counts = getChartCounts();

        replaceIndicator(
            "#chart-status-indicator",
            () => createChartStatusIndicatorFromCounts(counts),
            cleanupChartStatusIndicatorFromCounts,
            runtime
        );

        const didUpdateGlobalIndicator = replaceIndicator(
            "#global-chart-status",
            () => createGlobalChartStatusIndicatorFromCounts(counts),
            cleanupGlobalChartStatusIndicatorFromCounts,
            runtime
        );

        if (!didUpdateGlobalIndicator) {
            createGlobalChartStatusIndicator();
        }
    } catch (error) {
        console.error(
            "[ChartStatus] Error updating all chart status indicators:",
            error
        );
    }
}

/**
 * Update a single chart status indicator element.
 */
export function updateChartStatusIndicator(
    indicator: HTMLElement | null = null
): void {
    try {
        const runtime = getChartStatusIndicatorRuntime();
        const target =
            indicator ?? runtime.querySelector("#chart-status-indicator");
        if (!target) {
            return;
        }

        const newIndicator = createChartStatusIndicator();
        if (
            newIndicator &&
            runtime.isHTMLElement(target) &&
            target.parentNode
        ) {
            cleanupChartStatusIndicatorFromCounts(target);
            target.replaceWith(newIndicator);
        }
    } catch (error) {
        console.error(
            "[ChartStatus] Error updating chart status indicator:",
            error
        );
    }
}

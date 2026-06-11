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
import { getChartStatusIndicatorRuntime } from "./chartStatusIndicatorRuntime.js";

const pendingStatusTimeouts = new Set<ReturnType<typeof setTimeout>>();
const setupSubscriptions = new Set<() => void>();

let setupController: AbortController | null = null;

function clearPendingStatusTimeouts(): void {
    for (const timeoutId of pendingStatusTimeouts) {
        clearTimeout(timeoutId);
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
    callback: () => void
): void {
    const timeoutRef: { id?: ReturnType<typeof setTimeout> } = {};
    let didRun = false;
    timeoutRef.id = setTimeout(() => {
        didRun = true;
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

    if (!didRun) {
        pendingStatusTimeouts.add(timeoutRef.id);
    }
}

function scheduleIndicatorRefresh(errorMessage: string, delayMs = 50): void {
    scheduleChartStatusWork(delayMs, errorMessage, () => {
        updateAllChartStatusIndicators();
    });
}

function replaceIndicator(
    selector: string,
    createReplacement: () => HTMLElement | null,
    cleanupCurrentIndicator?: (indicator: HTMLElement) => void
): boolean {
    const currentIndicator = document.querySelector(selector);
    if (!currentIndicator) {
        return false;
    }

    const newIndicator = createReplacement();
    if (
        newIndicator &&
        currentIndicator instanceof HTMLElement &&
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
        setupController = new AbortController();
        const { signal } = setupController;
        const runtime = getChartStatusIndicatorRuntime();

        trackSetupSubscription(
            subscribeToChartSettings(() => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in chart settings handler:"
                );
            })
        );
        trackSetupSubscription(
            subscribeToActiveFitRawData(() => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in fitFile.rawData state handler:",
                    100
                );
            })
        );

        runtime.addFieldToggleChangedListener(
            () => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in fieldToggleChanged handler:"
                );
            },
            { signal }
        );

        document.addEventListener(
            "chartsRendered",
            () => {
                scheduleIndicatorRefresh(
                    "[ChartStatus] Error in chartsRendered handler:"
                );
            },
            { signal }
        );

        scheduleChartStatusWork(
            100,
            "[ChartStatus] Error creating initial global indicator:",
            () => {
                createGlobalChartStatusIndicator();
            }
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
        const counts = getChartCounts();

        replaceIndicator(
            "#chart-status-indicator",
            () => createChartStatusIndicatorFromCounts(counts),
            cleanupChartStatusIndicatorFromCounts
        );

        const didUpdateGlobalIndicator = replaceIndicator(
            "#global-chart-status",
            () => createGlobalChartStatusIndicatorFromCounts(counts),
            cleanupGlobalChartStatusIndicatorFromCounts
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
        const target =
            indicator ?? document.querySelector("#chart-status-indicator");
        if (!target) {
            return;
        }

        const newIndicator = createChartStatusIndicator();
        if (
            newIndicator &&
            target instanceof HTMLElement &&
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

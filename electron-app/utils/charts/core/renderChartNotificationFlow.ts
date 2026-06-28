import {
    getRendererActiveTab,
    isRendererChartTab,
} from "../../state/domain/rendererActiveTabState.js";
import type { ChartStateUpdateOptions } from "./renderChartStateAccess.js";
import { getRenderChartTimerRuntime } from "./renderChartTimerRuntime.js";

type DateNowFunction = () => number;
type NotifySuccessFunction = (message: string, type: "success") => unknown;
type ScheduleFunction = (callback: () => void, delay: number) => unknown;
type ShowRenderNotificationFunction = (
    totalChartsRendered: number,
    visibleFieldCount: number
) => boolean;
type UpdateStateFunction = (
    path: string,
    value: Record<string, unknown>,
    options?: ChartStateUpdateOptions
) => void;

interface ChartRenderNotificationDependencies {
    isTestRuntime: boolean;
    notify: NotifySuccessFunction;
    showRenderNotification: ShowRenderNotificationFunction;
    updateState: UpdateStateFunction;
}

interface ChartRenderNotificationInput {
    dateNow?: DateNowFunction;
    schedule?: ScheduleFunction;
    totalChartsRendered: number;
    visibleFieldCount: number;
}

function isChartTabActive(activeTab: unknown, isTestRuntime: boolean): boolean {
    return isTestRuntime || isRendererChartTab(activeTab);
}

function createRenderSuccessMessage(totalChartsRendered: number): string {
    return totalChartsRendered === 1
        ? "Chart rendered successfully"
        : `Rendered ${totalChartsRendered} charts successfully`;
}

const defaultSchedule: ScheduleFunction = (callback, delay) =>
    getRenderChartTimerRuntime().setTimeout(callback, delay);
const defaultDateNow: DateNowFunction = () =>
    getRenderChartTimerRuntime().dateNow();

function notifySuccessLater(
    notifySuccess: NotifySuccessFunction,
    message: string
): void {
    Promise.resolve(notifySuccess(message, "success")).catch((error: unknown) =>
        console.warn("[ChartJS] Success notification failed:", error)
    );
}

/**
 * Handles the success-notification side effects for a completed chart render.
 *
 * @param dependencies - State and notification dependencies.
 * @param input - Render counts and optional scheduler override.
 */
export function handleChartRenderNotification(
    dependencies: ChartRenderNotificationDependencies,
    input: ChartRenderNotificationInput
): void {
    const {
        isTestRuntime,
        notify: notifySuccess,
        showRenderNotification,
        updateState: updateChartState,
    } = dependencies;
    const {
        dateNow = defaultDateNow,
        schedule = defaultSchedule,
        totalChartsRendered,
        visibleFieldCount,
    } = input;

    const shouldShowNotification = showRenderNotification(
        totalChartsRendered,
        visibleFieldCount
    );

    if (shouldShowNotification && totalChartsRendered > 0) {
        const activeTab = getRendererActiveTab();

        if (isChartTabActive(activeTab, isTestRuntime)) {
            const message = createRenderSuccessMessage(totalChartsRendered);

            console.log(`[ChartJS] Showing success notification: "${message}"`);

            schedule(() => {
                const currentTab = getRendererActiveTab();
                if (isChartTabActive(currentTab, isTestRuntime)) {
                    notifySuccessLater(notifySuccess, message);
                } else {
                    console.log(
                        `[ChartJS] Notification cancelled - tab switched to ${String(currentTab)}`
                    );
                }
            }, 100);

            updateChartState(
                "ui",
                {
                    lastNotification: {
                        message,
                        timestamp: dateNow(),
                        type: "success",
                    },
                },
                { merge: true, source: "renderChartsWithData" }
            );
            return;
        }

        console.log(
            `[ChartJS] Suppressing notification - chart tab no longer active (current tab: ${String(activeTab)})`
        );
        return;
    }

    console.log(
        `[ChartJS] No notification shown - shouldShow: ${String(shouldShowNotification)}, totalChartsRendered: ${totalChartsRendered}`
    );
}

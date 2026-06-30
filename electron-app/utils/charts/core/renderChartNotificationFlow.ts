import {
    getRendererActiveTab,
    isRendererChartTab,
} from "../../state/domain/rendererActiveTabState.js";
import type { NotificationType } from "../../state/domain/rendererNotificationState.js";
import { getRenderChartTimerRuntime } from "./renderChartTimerRuntime.js";

type DateNowFunction = () => number;
type NotifySuccessFunction = (
    message: string,
    type: "success"
) => Promise<void> | void;
type ScheduleFunction = (callback: () => void, delay: number) => unknown;
type ShowRenderNotificationFunction = (
    totalChartsRendered: number,
    visibleFieldCount: number
) => boolean;
type SetLastNotificationFunction = (
    notification: {
        message: string;
        timestamp: number;
        type: NotificationType;
    },
    options?: { source?: string }
) => void;

interface ChartRenderNotificationDependencies {
    isTestRuntime: boolean;
    notify: NotifySuccessFunction;
    setLastNotification: SetLastNotificationFunction;
    showRenderNotification: ShowRenderNotificationFunction;
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
        setLastNotification,
        showRenderNotification,
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

            setLastNotification(
                {
                    message,
                    timestamp: dateNow(),
                    type: "success",
                },
                { source: "renderChartsWithData" }
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

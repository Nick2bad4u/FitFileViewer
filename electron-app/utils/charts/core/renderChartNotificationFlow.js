function isChartTabActive(activeTab, isTestRuntime) {
    return isTestRuntime || activeTab === "chart" || activeTab === "chartjs";
}
function createRenderSuccessMessage(totalChartsRendered) {
    return totalChartsRendered === 1
        ? "Chart rendered successfully"
        : `Rendered ${totalChartsRendered} charts successfully`;
}
/**
 * Handles the success-notification side effects for a completed chart render.
 *
 * @param dependencies - State and notification dependencies.
 * @param input - Render counts and optional scheduler override.
 */
export function handleChartRenderNotification(dependencies, input) {
    const {
        getState,
        isTestRuntime,
        notify: notifySuccess,
        showRenderNotification,
        updateState: updateChartState,
    } = dependencies;
    const {
        schedule = (callback, delay) => setTimeout(callback, delay),
        totalChartsRendered,
        visibleFieldCount,
    } = input;
    const shouldShowNotification = showRenderNotification(
        totalChartsRendered,
        visibleFieldCount
    );
    if (shouldShowNotification && totalChartsRendered > 0) {
        const activeTab = getState("ui.activeTab");
        if (isChartTabActive(activeTab, isTestRuntime)) {
            const message = createRenderSuccessMessage(totalChartsRendered);
            console.log(`[ChartJS] Showing success notification: "${message}"`);
            schedule(() => {
                const currentTab = getState("ui.activeTab");
                if (isChartTabActive(currentTab, isTestRuntime)) {
                    Promise.resolve().then(() =>
                        notifySuccess(message, "success")
                    );
                } else {
                    console.log(
                        `[ChartJS] Notification cancelled - tab switched to ${currentTab}`
                    );
                }
            }, 100);
            updateChartState(
                "ui",
                {
                    lastNotification: {
                        message,
                        timestamp: Date.now(),
                        type: "success",
                    },
                },
                { merge: true, source: "renderChartsWithData" }
            );
            return;
        }
        console.log(
            `[ChartJS] Suppressing notification - chart tab no longer active (current tab: ${activeTab})`
        );
        return;
    }
    console.log(
        `[ChartJS] No notification shown - shouldShow: ${shouldShowNotification}, totalChartsRendered: ${totalChartsRendered}`
    );
}

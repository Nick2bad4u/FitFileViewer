import {
    getMainUiSummaryColumnSelectorRuntime,
    type MainUiSummaryColumnSelectorRuntime,
    type MainUiSummaryColumnSelectorTimer,
} from "./mainUiSummaryColumnSelectorRuntime.js";

export interface MainUiSummaryColumnSelectorHandlerDependencies {
    readonly delay: number;
    readonly gearButtonSelector: string;
    readonly logMainUi: (
        level: "error" | "warn",
        message: string,
        ...args: unknown[]
    ) => void;
    readonly registerTimer: (
        timer: MainUiSummaryColumnSelectorTimer,
        options: { readonly owner: string }
    ) => unknown;
    readonly runtime?: MainUiSummaryColumnSelectorRuntime | undefined;
    readonly summaryTabId: string;
}

export function createMainUiSummaryColumnSelectorHandler({
    delay,
    gearButtonSelector,
    logMainUi,
    registerTimer,
    runtime = getMainUiSummaryColumnSelectorRuntime(),
    summaryTabId,
}: MainUiSummaryColumnSelectorHandlerDependencies): () => void {
    return () => {
        try {
            const summaryTab = runtime.getSummaryTab(summaryTabId);
            if (summaryTab && !summaryTab.classList.contains("active")) {
                summaryTab.click();
            }

            const summarySelectorTimer = runtime.setTimeout(() => {
                const gearButton =
                    runtime.getSummaryGearButton(gearButtonSelector);
                if (gearButton) {
                    gearButton.click();
                } else {
                    logMainUi("warn", "Summary gear button not found");
                }
            }, delay);

            registerTimer(summarySelectorTimer, {
                owner: "main-ui.summary-column-selector",
            });
        } catch (error) {
            logMainUi(
                "error",
                "Error handling summary column selector:",
                error
            );
        }
    };
}

import type { MainUiElectronApi } from "./mainUiElectronApi.js";

import { createMainUiSummaryColumnSelectorHandler } from "./mainUiSummaryColumnSelector.js";
import { resourceManager } from "../utils/app/lifecycle/resourceManager.js";

export interface MainUiSummarySelectorRegistrationOptions {
    readonly delay: number;
    readonly electronAPI: MainUiElectronApi | null;
    readonly gearButtonSelector: string;
    readonly logMainUi: (
        level: "error" | "warn",
        message: string,
        ...args: unknown[]
    ) => void;
    readonly summaryTabId: string;
}

export function registerMainUiSummaryColumnSelector({
    delay,
    electronAPI,
    gearButtonSelector,
    logMainUi,
    summaryTabId,
}: MainUiSummarySelectorRegistrationOptions): void {
    if (typeof electronAPI?.onOpenSummaryColumnSelector !== "function") {
        return;
    }

    electronAPI.onOpenSummaryColumnSelector(
        createMainUiSummaryColumnSelectorHandler({
            delay,
            gearButtonSelector,
            logMainUi,
            registerTimer: (timer, options) =>
                resourceManager.registerTimer(timer, options),
            summaryTabId,
        })
    );
}

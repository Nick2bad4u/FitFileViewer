import { AppActions } from "../utils/app/lifecycle/appActions.js";
import { resourceManager } from "../utils/app/lifecycle/resourceManager.js";
import { cleanupEventListeners } from "../utils/ui/mainUiDomUtils.js";

export interface MainUiShutdownOptions {
    readonly cleanupExternalLinks: () => void;
    readonly logMainUi: (
        level: "info",
        message: string,
        ...args: unknown[]
    ) => void;
}

export function registerMainUiShutdownHook({
    cleanupExternalLinks,
    logMainUi,
}: MainUiShutdownOptions): void {
    resourceManager.addShutdownHook(() => {
        logMainUi("info", "[ResourceManager] Executing main-ui cleanup...");
        try {
            cleanupExternalLinks();
        } catch {
            /* Ignore cleanup errors during shutdown. */
        }
        cleanupEventListeners();
        AppActions.clearData();
    });
}

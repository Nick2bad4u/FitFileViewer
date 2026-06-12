import { chartTabIntegration } from "../utils/charts/core/chartTabIntegration.js";

export interface MainUiStateStartupOptions {
    readonly logMainUi: (
        level: "info",
        message: string,
        ...args: unknown[]
    ) => void;
}

export function logMainUiStateStartup({
    logMainUi,
}: MainUiStateStartupOptions): void {
    logMainUi("info", "[main-ui] Initializing state managers...");
    logMainUi(
        "info",
        "[main-ui] Chart tab integration:",
        chartTabIntegration.getStatus()
    );
    logMainUi("info", "[main-ui] State managers initialized successfully");
}

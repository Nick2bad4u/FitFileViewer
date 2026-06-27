import type { MainUiMenuInjectionElectronApi } from "./mainUiElectronApi.js";

import { AppActions } from "../utils/app/lifecycle/appActions.js";
import { resourceManager } from "../utils/app/lifecycle/resourceManager.js";
import { chartTabIntegration } from "../utils/charts/core/chartTabIntegration.js";
import { setRendererChartsRendered } from "../utils/state/domain/rendererChartRenderState.js";
import { setRendererDragCounter } from "../utils/state/domain/rendererDragDropState.js";
import { cleanupEventListeners } from "../utils/ui/mainUiDomUtils.js";

export interface MainUiDevelopmentActionsOptions {
    readonly getElectronAPI: () => MainUiMenuInjectionElectronApi | null;
    readonly logMainUi: (
        level: "error" | "info" | "warn",
        message: string,
        ...args: unknown[]
    ) => void;
}

export function createMainUiMenuInjectionRequester({
    getElectronAPI,
    logMainUi,
}: MainUiDevelopmentActionsOptions): (
    theme?: null | string,
    fitFilePath?: null | string
) => void {
    return (theme = null, fitFilePath = null): void => {
        try {
            const api = getElectronAPI();
            if (typeof api?.injectMenu === "function") {
                void api.injectMenu(theme, fitFilePath);
                logMainUi(
                    "info",
                    "[injectMenu] Requested menu injection with theme:",
                    theme,
                    "fitFilePath:",
                    fitFilePath
                );
            } else {
                logMainUi(
                    "warn",
                    "[injectMenu] electronAPI.injectMenu is not available."
                );
            }
        } catch (error) {
            logMainUi(
                "error",
                "[injectMenu] Error during menu injection:",
                error
            );
        }
    };
}

export function createMainUiDevelopmentCleanup({
    logMainUi,
}: Pick<MainUiDevelopmentActionsOptions, "logMainUi">): () => void {
    return (): void => {
        cleanupEventListeners();
        AppActions.clearData();
        setRendererChartsRendered(false, {
            silent: false,
            source: "devCleanup",
        });
        setRendererDragCounter(0, {
            silent: false,
            source: "devCleanup",
        });

        if (typeof chartTabIntegration.destroy === "function") {
            chartTabIntegration.destroy();
        }

        resourceManager.cleanupAll();

        logMainUi(
            "info",
            "[devCleanup] Application state and event listeners cleaned up"
        );
    };
}

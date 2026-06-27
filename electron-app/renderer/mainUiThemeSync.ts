import type { MainUiThemeSyncElectronApi } from "./mainUiElectronApi.js";

import { createRendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import { UIActions } from "../utils/state/domain/uiStateManager.js";
import {
    applyTheme,
    listenForThemeChange,
    loadTheme,
} from "../utils/theming/core/theme.js";

export interface MainUiThemeSyncOptions {
    readonly getElectronAPI: () => MainUiThemeSyncElectronApi | null;
    readonly logMainUi: (
        level: "info",
        message: string,
        ...args: unknown[]
    ) => void;
}

export function initializeMainUiThemeSync({
    getElectronAPI,
    logMainUi,
}: MainUiThemeSyncOptions): void {
    const electronAPI = getElectronAPI();
    if (
        typeof electronAPI?.onSetTheme === "function" &&
        typeof electronAPI.sendThemeChanged === "function"
    ) {
        listenForThemeChange(
            (theme) => {
                applyTheme(theme);
                UIActions.setTheme(theme);
                logMainUi("info", `[main-ui] Theme changed to: ${theme}`);
            },
            { electronApiScope: createRendererElectronApiScope(getElectronAPI) }
        );
    }

    applyTheme(loadTheme());
}

import { CONSTANTS } from "../constants.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import { browserWindowRef as electronBrowserWindowRef } from "../runtime/electronAccess.js";
import { validateWindow } from "../window/windowValidation.js";

{
    type RendererIpcEventChannel =
        import("../../shared/ipc").RendererIpcEventChannel;
    interface MainWindowLike {
        isDestroyed?: () => boolean;
        webContents: {
            executeJavaScript?: (script: string) => Promise<unknown>;
            isDestroyed?: () => boolean;
            send?: (
                channel: RendererIpcEventChannel,
                ...args: readonly unknown[]
            ) => void;
        };
    }

    interface BrowserWindowConstructorLike {
        getFocusedWindow: () => MainWindowLike | null;
    }

    interface MainProcessStateDataLike {
        eventHandlers: { size: number };
    }

    interface MainProcessStateLike {
        data: MainProcessStateDataLike;
    }

    interface DevHelpers {
        cleanupEventHandlers: () => void;
        getAppState: () => MainProcessStateDataLike;
        logState: () => void;
        rebuildMenu: (theme?: null | string, filePath?: null | string) => void;
    }

    const browserWindowRef = electronBrowserWindowRef as () => unknown;
    const { cleanupEventHandlers, getAppState, mainProcessState } =
        require("../state/appState") as {
            cleanupEventHandlers: () => void;
            getAppState: (statePath: string) => unknown;
            mainProcessState: MainProcessStateLike;
        };
    const validateMainWindow = validateWindow as (
        win?: MainWindowLike | null,
        context?: string
    ) => win is MainWindowLike;

    const hasFocusedWindowApi = (
        value: unknown
    ): value is BrowserWindowConstructorLike =>
        Boolean(
            value &&
            typeof value === "function" &&
            typeof Reflect.get(value, "getFocusedWindow") === "function"
        );

    const getLoadedFitFilePath = (): null | string => {
        const loadedFitFilePath = getAppState("loadedFitFilePath");

        return typeof loadedFitFilePath === "string" ? loadedFitFilePath : null;
    };

    /**
     * Creates debugging helpers for development builds.
     */
    function exposeDevHelpers(): DevHelpers {
        const devHelpers: DevHelpers = {
            cleanupEventHandlers,
            getAppState: () => mainProcessState.data,
            logState: () => {
                logWithContext("info", "Current application state:", {
                    eventHandlersCount:
                        mainProcessState.data.eventHandlers.size,
                    hasMainWindow: Boolean(getAppState("mainWindow")),
                    loadedFitFilePath: getAppState("loadedFitFilePath"),
                });
            },
            rebuildMenu: (theme, filePath) => {
                const BrowserWindow = browserWindowRef();
                const win = hasFocusedWindowApi(BrowserWindow)
                    ? BrowserWindow.getFocusedWindow()
                    : null;

                if (validateMainWindow(win, "dev helper rebuild menu")) {
                    safeCreateAppMenu(
                        win,
                        theme || CONSTANTS.DEFAULT_THEME,
                        filePath || getLoadedFitFilePath()
                    );
                }
            },
        };

        logWithContext("info", "Development helpers initialized");

        return devHelpers;
    }

    module.exports = { exposeDevHelpers };
}

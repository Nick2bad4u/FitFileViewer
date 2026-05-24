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

    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: { DEFAULT_THEME: string };
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: (
            level: string,
            message: string,
            context?: Record<string, unknown>
        ) => void;
    };
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu") as {
        safeCreateAppMenu: (
            mainWindow: MainWindowLike,
            theme: string,
            loadedFitFilePath?: null | string
        ) => void;
    };
    const { browserWindowRef } = require("../runtime/electronAccess") as {
        browserWindowRef: () => unknown;
    };
    const { cleanupEventHandlers, getAppState, mainProcessState } =
        require("../state/appState") as {
            cleanupEventHandlers: () => void;
            getAppState: (statePath: string) => unknown;
            mainProcessState: MainProcessStateLike;
        };
    const { validateWindow } = require("../window/windowValidation") as {
        validateWindow: (
            win?: MainWindowLike | null,
            context?: string
        ) => win is MainWindowLike;
    };

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
     * Attaches debugging helpers to the global object for development builds.
     * Mirroring the legacy behaviour keeps the devtools workflow untouched
     * while allowing the logic to live outside main.js.
     */
    function exposeDevHelpers(): void {
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

                if (validateWindow(win, "dev helper rebuild menu")) {
                    safeCreateAppMenu(
                        win,
                        theme || CONSTANTS.DEFAULT_THEME,
                        filePath || getLoadedFitFilePath()
                    );
                }
            },
        };

        Object.defineProperty(globalThis, "devHelpers", {
            configurable: true,
            enumerable: false,
            value: devHelpers,
            writable: true,
        });

        logWithContext(
            "info",
            "Development helpers exposed on global.devHelpers"
        );
    }

    module.exports = { exposeDevHelpers };
}

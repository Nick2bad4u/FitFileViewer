import { CONSTANTS } from "../constants.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import { browserWindowRef as electronBrowserWindowRef } from "../runtime/electronAccess.js";
import {
    cleanupEventHandlers,
    getAppState,
    mainProcessState,
} from "../state/appState.js";
import {
    resolveFocusedMainWindow,
    type MainWindowBrowserWindowApi,
} from "../window/mainWindowSelection.js";
import { validateWindow } from "../window/windowValidation.js";

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

const browserWindowRef = electronBrowserWindowRef as () =>
    | MainWindowBrowserWindowApi<MainWindowLike>
    | null
    | undefined;
const typedMainProcessState = mainProcessState as MainProcessStateLike;
const validateMainWindow = validateWindow as (
    win?: MainWindowLike | null,
    context?: string
) => win is MainWindowLike;

const getLoadedFitFilePath = (): null | string => {
    const loadedFitFilePath = getAppState("loadedFitFilePath");

    return typeof loadedFitFilePath === "string" ? loadedFitFilePath : null;
};

/**
 * Creates debugging helpers for development builds.
 */
export function exposeDevHelpers(): DevHelpers {
    const devHelpers: DevHelpers = {
        cleanupEventHandlers,
        getAppState: () => typedMainProcessState.data,
        logState: () => {
            logWithContext("info", "Current application state:", {
                eventHandlersCount:
                    typedMainProcessState.data.eventHandlers.size,
                hasMainWindow: Boolean(getAppState("mainWindow")),
                loadedFitFilePath: getAppState("loadedFitFilePath"),
            });
        },
        rebuildMenu: (theme, filePath) => {
            const win = resolveFocusedMainWindow(browserWindowRef());

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

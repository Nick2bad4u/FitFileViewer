import {
    resolveFocusedMainWindow as resolveDefaultFocusedMainWindow,
    type MainWindowBrowserWindowApi,
} from "../window/mainWindowSelection.js";

type BrowserWindow = import("electron").BrowserWindow;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;

type RegisterFullscreenIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: (event: unknown, flag: unknown) => void
) => void;

interface RegisterFullscreenHandlerOptions {
    browserWindowRef: () =>
        | MainWindowBrowserWindowApi<BrowserWindow>
        | null
        | undefined;
    registerIpcListener: RegisterFullscreenIpcListener;
    resolveFocusedMainWindow?: (
        BrowserWindow:
            | MainWindowBrowserWindowApi<BrowserWindow>
            | null
            | undefined
    ) => BrowserWindow | undefined;
    validateWindow: (win: BrowserWindow, context: string) => boolean;
}

/**
 * Registers the main-process handler for renderer fullscreen requests.
 */
export function registerFullscreenHandler({
    browserWindowRef,
    registerIpcListener,
    resolveFocusedMainWindow = resolveDefaultFocusedMainWindow,
    validateWindow,
}: RegisterFullscreenHandlerOptions): void {
    if (typeof registerIpcListener !== "function") {
        return;
    }

    registerIpcListener("set-fullscreen", (_event, flag) => {
        const win = resolveFocusedMainWindow(browserWindowRef());
        if (win && validateWindow(win, "set-fullscreen event")) {
            win.setFullScreen(Boolean(flag));
        }
    });
}

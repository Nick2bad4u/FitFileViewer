import { registerIpcHandle, registerIpcListener } from "../ipc/ipcRegistry.js";
import { browserWindowRef as electronBrowserWindowRef } from "../runtime/electronAccess.js";
import { validateWindow } from "../window/windowValidation.js";
import { registerDevtoolsInjectMenuHandler } from "./registerDevtoolsInjectMenuHandler.js";
import { registerFileMenuHandlers } from "./registerFileMenuHandlers.js";
import { registerFullscreenHandler } from "./registerFullscreenHandler.js";
import { registerThemeChangedHandler } from "./registerThemeChangedHandler.js";
import { registerUpdateMenuHandlers } from "./registerUpdateMenuHandlers.js";
import { safeCreateAppMenu } from "./safeCreateAppMenu.js";

type BrowserWindow = import("electron").BrowserWindow;

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
    getFocusedWindow?: () => BrowserWindow | null | undefined;
}

const browserWindowRef = electronBrowserWindowRef as () =>
    | BrowserWindowRefLike
    | null
    | undefined;

/**
 * Registers menu-related IPC handlers and listeners.
 */
export function setupMenuAndEventHandlers(): void {
    registerThemeChangedHandler({
        browserWindowRef,
        registerIpcListener,
        safeCreateAppMenu,
        validateWindow,
    });

    registerUpdateMenuHandlers({
        browserWindowRef,
        registerIpcListener,
    });

    registerFileMenuHandlers({
        browserWindowRef,
        registerIpcListener,
    });

    registerFullscreenHandler({
        browserWindowRef,
        registerIpcListener,
        validateWindow,
    });

    registerDevtoolsInjectMenuHandler({
        browserWindowRef,
        registerIpcHandle,
        safeCreateAppMenu,
    });
}

"use strict";
{
    const { logWithContext } = require("../logging/logWithContext");
    const { getAppState } = require("../state/appState");
    /**
     * Determines whether the provided BrowserWindow is still usable.
     *
     * @returns True when the window and its webContents remain alive.
     */
    function isWindowUsable(win) {
        if (!win) {
            return false;
        }
        try {
            if (!win.webContents) {
                return false;
            }
            const webContentsDestroyed =
                typeof win.webContents.isDestroyed === "function"
                    ? win.webContents.isDestroyed()
                    : true;
            const windowDestroyed =
                typeof win.isDestroyed === "function"
                    ? win.isDestroyed()
                    : true;
            return !windowDestroyed && !webContentsDestroyed;
        } catch {
            return false;
        }
    }
    /**
     * Validates that a BrowserWindow is usable and logs a structured warning
     * when it is not.
     *
     * @param context - Description of the operation requiring the window.
     *
     * @returns True when the window can be used.
     */
    function validateWindow(win, context = "unknown operation") {
        if (isWindowUsable(win)) {
            return true;
        }
        if (!getAppState("appIsQuitting")) {
            logWithContext(
                "warn",
                `Window validation failed during ${context}`,
                {
                    hasWebContents: Boolean(win?.webContents),
                    hasWindow: Boolean(win),
                    isDestroyed: win?.isDestroyed?.(),
                    webContentsDestroyed: win?.webContents?.isDestroyed?.(),
                }
            );
        }
        return false;
    }
    module.exports = {
        isWindowUsable,
        validateWindow,
    };
}

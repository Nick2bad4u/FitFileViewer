const { logWithContext } = require("../logging/logWithContext");
const { getAppState } = require("../state/appState");

/**
 * Determines whether the provided BrowserWindow is still usable.
 *
 * @param {any} win - Candidate BrowserWindow instance.
 * @returns {boolean} True when the window and its webContents remain alive.
 */
function isWindowUsable(win) {
    if (!win) return false;
    try {
        const hasWebContents = Boolean(win.webContents);
        const webContentsDestroyed =
            hasWebContents && typeof win.webContents.isDestroyed === "function" ? win.webContents.isDestroyed() : true;
        const windowDestroyed = typeof win.isDestroyed === "function" ? win.isDestroyed() : true;
        return Boolean(!windowDestroyed && hasWebContents && !webContentsDestroyed);
    } catch {
        return false;
    }
}

/**
 * Validates that a BrowserWindow is usable and logs a structured warning when it is not.
 *
 * @param {any} win - Target BrowserWindow instance.
 * @param {string} [context="unknown operation"] - Description of the operation requiring the window.
 * @returns {boolean} True when the window can be used.
 */
function validateWindow(win, context = "unknown operation") {
    if (!isWindowUsable(win)) {
        if (!getAppState("appIsQuitting")) {
            logWithContext("warn", `Window validation failed during ${context}`, {
                hasWebContents: Boolean(win?.webContents),
                hasWindow: Boolean(win),
                isDestroyed: win?.isDestroyed?.(),
                webContentsDestroyed: win?.webContents?.isDestroyed?.(),
            });
        }
        return false;
    }
    return true;
}

module.exports = {
    isWindowUsable,
    validateWindow,
};

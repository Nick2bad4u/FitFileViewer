const { logWithContext } = require("../logging/logWithContext");

/**
 * Lazily creates the application menu. The helper is intentionally defensive so unit tests that
 * run without a real Electron runtime do not crash when the menu builder is required.
 *
 * @param {any} mainWindow - Target BrowserWindow instance.
 * @param {string} theme - Currently active theme.
 * @param {string | undefined | null} loadedFitFilePath - Path of the currently loaded FIT file.
 */
function safeCreateAppMenu(mainWindow, theme, loadedFitFilePath) {
    try {
        if (/** @type {any} */ (process.env).NODE_ENV === "test") {
            return;
        }

        const mod = require("../../utils/app/menu/createAppMenu");
        const fn = mod && mod.createAppMenu;
        if (typeof fn === "function") {
            fn(mainWindow, theme, loadedFitFilePath);
        }
    } catch (error) {
        logWithContext("warn", "Skipping menu creation (unavailable in this environment)", {
            error: /** @type {Error} */ (error).message,
        });
    }
}

module.exports = { safeCreateAppMenu };

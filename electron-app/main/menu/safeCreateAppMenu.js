const { logWithContext } = require("../logging/logWithContext");

/**
 * @typedef {import("../../types/main/window/bootstrapMainWindow").MainWindowLike} MainWindowLike
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Lazily creates the application menu. The helper is intentionally defensive so
 * unit tests that run without a real Electron runtime do not crash when the
 * menu builder is required.
 *
 * @param {MainWindowLike} mainWindow - Target BrowserWindow instance.
 * @param {string} theme - Currently active theme.
 * @param {string | undefined | null} loadedFitFilePath - Path of the currently
 *   loaded FIT file.
 */
function safeCreateAppMenu(mainWindow, theme, loadedFitFilePath) {
    try {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const mod = require("../../utils/app/menu/createAppMenu");
        const fn = mod && mod.createAppMenu;
        if (typeof fn === "function") {
            fn(mainWindow, theme, loadedFitFilePath);
        }
    } catch (error) {
        logWithContext(
            "warn",
            "Skipping menu creation (unavailable in this environment)",
            {
                error: getErrorMessage(error),
            }
        );
    }
}

module.exports = { safeCreateAppMenu };

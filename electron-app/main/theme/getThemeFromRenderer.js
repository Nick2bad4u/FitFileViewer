const { CONSTANTS } = require("../constants");
const { validateWindow } = require("../window/windowValidation");

/**
 * @typedef {{
 *     isDestroyed?: () => boolean;
 *     webContents?: {
 *         executeJavaScript: (script: string) => Promise<unknown>;
 *         isDestroyed?: () => boolean;
 *     };
 * }} ThemeWindowCandidate
 */

/**
 * Fetches the persisted theme from the renderer by reading localStorage. The
 * helper is resilient to missing BrowserWindow instances so Jasmine/Vitest
 * environments without a DOM do not crash.
 *
 * @param {ThemeWindowCandidate | null | undefined} win - BrowserWindow whose
 *   webContents will be queried.
 *
 * @returns {Promise<string>} Resolved theme name falling back to the default
 *   theme.
 */
async function getThemeFromRenderer(win) {
    if (!validateWindow(win, "theme retrieval")) {
        return CONSTANTS.DEFAULT_THEME;
    }

    try {
        const theme = await win.webContents.executeJavaScript(
            `localStorage.getItem("${CONSTANTS.THEME_STORAGE_KEY}")`
        );
        return typeof theme === "string" && theme
            ? theme
            : CONSTANTS.DEFAULT_THEME;
    } catch (error) {
        console.error("[main.js] Failed to get theme from renderer:", error);
        return CONSTANTS.DEFAULT_THEME;
    }
}

module.exports = { getThemeFromRenderer };

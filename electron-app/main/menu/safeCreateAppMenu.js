"use strict";
{
    const { logWithContext } = require("../logging/logWithContext");
    const getErrorMessage = (error) => error instanceof Error ? error.message : String(error);
    const getNodeEnvironment = () => globalThis.process?.env?.["NODE_ENV"];
    const isCreateAppMenu = (value) => typeof value === "function";
    /**
     * Lazily creates the application menu. The helper is intentionally defensive so
     * unit tests that run without a real Electron runtime do not crash when the
     * menu builder is required.
     */
    function safeCreateAppMenu(mainWindow, theme, loadedFitFilePath) {
        try {
            if (getNodeEnvironment() === "test") {
                return;
            }
            const mod = require("../../utils/app/menu/createAppMenu");
            const createAppMenu = mod.createAppMenu;
            if (isCreateAppMenu(createAppMenu)) {
                createAppMenu(mainWindow, theme, loadedFitFilePath);
            }
        }
        catch (error) {
            logWithContext("warn", "Skipping menu creation (unavailable in this environment)", {
                error: getErrorMessage(error),
            });
        }
    }
    module.exports = { safeCreateAppMenu };
}

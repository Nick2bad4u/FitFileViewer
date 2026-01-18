const { addRecentFile, loadRecentFiles } = require("../../utils/files/recent/recentFiles");
const { CONSTANTS } = require("../constants");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { startGyazoOAuthServer, stopGyazoOAuthServer } = require("../oauth/gyazoOAuthServer");
const { appRef, browserWindowRef, dialogRef, shellRef } = require("../runtime/electronAccess");
const { ensureFitParserStateIntegration } = require("../runtime/fitParserIntegration");
const { fs, path } = require("../runtime/nodeModules");
const { assertFileReadAllowed } = require("../security/fileAccessPolicy");
const { getAppState, setAppState } = require("../state/appState");
const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
const { registerIpcHandle, registerIpcListener } = require("./ipcRegistry");
const { registerDialogHandlers } = require("./registerDialogHandlers");
const { registerExternalHandlers } = require("./registerExternalHandlers");
const { registerFileSystemHandlers } = require("./registerFileSystemHandlers");
const { registerFitFileHandlers } = require("./registerFitFileHandlers");
const { registerInfoHandlers } = require("./registerInfoHandlers");
const { registerRecentFileHandlers } = require("./registerRecentFileHandlers");

/**
 * Registers all IPC handlers for the main process. The structure mirrors the legacy implementation
 * but lives in a dedicated module to keep main.js lean.
 *
 * @param {any} mainWindow - Primary BrowserWindow instance (may be undefined in some test scenarios).
 */
function setupIPCHandlers(mainWindow) {
    ensureFitParserStateIntegration().catch((error) => {
        logWithContext("warn", "Fit parser state integration failed to initialize", {
            error: /** @type {Error} */ (error)?.message,
        });
    });

    registerDialogHandlers({
        addRecentFile,
        browserWindowRef,
        CONSTANTS,
        dialogRef,
        getThemeFromRenderer,
        logWithContext,
        mainWindow,
        registerIpcHandle,
        safeCreateAppMenu,
        setAppState,
    });

    registerRecentFileHandlers({
        registerIpcHandle,
        addRecentFile,
        loadRecentFiles,
        browserWindowRef,
        mainWindow,
        getThemeFromRenderer,
        safeCreateAppMenu,
        getAppState,
        logWithContext,
    });

    // Consolidated IPC registrations.
    // These helpers are unit-tested individually and avoid handler duplication.
    registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext });
    registerFitFileHandlers({ registerIpcHandle, ensureFitParserStateIntegration, logWithContext });
    registerInfoHandlers({ registerIpcHandle, appRef, fs, path, CONSTANTS, logWithContext });
    registerExternalHandlers({
        registerIpcHandle,
        logWithContext,
        shellRef,
        startGyazoOAuthServer,
        stopGyazoOAuthServer,
    });

    registerIpcListener("fit-file-loaded", async (event, filePath) => {
        // Support clearing the loaded file state.
        // Renderer sends null when a file is unloaded.
        if (filePath === null || filePath === undefined || (typeof filePath === "string" && filePath.trim() === "")) {
            setAppState("loadedFitFilePath", null);
        } else {
            try {
                // Don't trust renderer-provided paths blindly; only persist if it is an approved FIT path.
                const approvedPath = assertFileReadAllowed(filePath);
                setAppState("loadedFitFilePath", approvedPath);
            } catch (error) {
                logWithContext("warn", "Rejected fit-file-loaded with unapproved path", {
                    error: /** @type {Error} */ (error)?.message,
                    filePath,
                });
                return;
            }
        }
        const win = browserWindowRef().fromWebContents(event.sender);
        if (win) {
            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (error) {
                logWithContext("error", "Failed to update menu after fit file loaded:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        }
    });
}

module.exports = { setupIPCHandlers };

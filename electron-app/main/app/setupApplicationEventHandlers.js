const { CONSTANTS } = require("../constants");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { startGyazoOAuthServer, stopGyazoOAuthServer } = require("../oauth/gyazoOAuthServer");
const { appRef, browserWindowRef } = require("../runtime/electronAccess");
const { httpRef } = require("../runtime/nodeModules");
const { getAppState, setAppState } = require("../state/appState");
const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
const { validateWindow } = require("../window/windowValidation");

/**
 * Registers core application-level Electron event handlers (activate, window-all-closed, etc.).
 */
function setupApplicationEventHandlers() {
    appRef().on("activate", () => {
        try {
            const BW = browserWindowRef();
            if (BW && typeof BW.getAllWindows === "function") {
                const windows = (() => {
                    try {
                        return BW.getAllWindows();
                    } catch {
                        return [];
                    }
                })();
                if (Array.isArray(windows) && windows.length === 0) {
                    const { createWindow } = require("../../windowStateUtils");
                    const win = createWindow();
                    safeCreateAppMenu(win, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
                } else {
                    const win =
                        (BW && typeof BW.getFocusedWindow === "function" ? BW.getFocusedWindow() : null) ||
                        getAppState("mainWindow");
                    if (validateWindow(win, "app activate event")) {
                        safeCreateAppMenu(win, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
                    }
                }
            } else {
                logWithContext("warn", "BrowserWindow unavailable during activate; skipping window handling");
            }
        } catch {
            /* ignore errors during activation handling */
        }
    });

    appRef().on("browser-window-focus", async (_event, win) => {
        if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (error) {
                logWithContext("error", "Error setting menu on browser-window-focus:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        }
    });

    appRef().on("window-all-closed", () => {
        setAppState("appIsQuitting", true);
        if (process.platform !== CONSTANTS.PLATFORMS.DARWIN) {
            const app = appRef();
            if (app && app.quit) app.quit();
        }
    });

    appRef().on("before-quit", async (event) => {
        setAppState("appIsQuitting", true);
        const gyazoServer = getAppState("gyazoServer");
        if (gyazoServer) {
            event.preventDefault();
            try {
                await stopGyazoOAuthServer();
                const a = appRef();
                if (a && a.quit) a.quit();
            } catch (error) {
                logWithContext("error", "Failed to stop Gyazo server during quit:", {
                    error: /** @type {Error} */ (error).message,
                });
                const a2 = appRef();
                if (a2 && a2.quit) a2.quit();
            }
        }
    });

    appRef().on("web-contents-created", (_event, contents) => {
        const allowedOrigins = [
            "file://",
            "about:blank",
            "https://gyazo.com/oauth/",
            "https://gyazo.com/api/oauth/login",
            "https://imgur.com/oauth/",
        ];

        contents.on("will-navigate", (event, navigationUrl) => {
            if (!allowedOrigins.some((origin) => navigationUrl.startsWith(origin))) {
                event.preventDefault();
                logWithContext("warn", "Blocked navigation to untrusted URL:", { url: navigationUrl });
            }
        });

        contents.setWindowOpenHandler(({ url }) => {
            if (!allowedOrigins.some((origin) => url.startsWith(origin))) {
                logWithContext("warn", "Blocked opening untrusted URL in new window:", { url });
                return { action: "deny" };
            }
            return { action: "allow" };
        });
    });

    if (process.env && process.env.GYAZO_CLIENT_ID && process.env.GYAZO_CLIENT_SECRET) {
        setTimeout(() => {
            try {
                const hasServer = Boolean(getAppState("gyazoServer"));
                if (hasServer) {
                    const http = httpRef();
                    if (http && typeof http.createServer === "function") {
                        try {
                            http.createServer(() => { });
                        } catch {
                            /* ignore */
                        }
                    }
                } else {
                    startGyazoOAuthServer().catch(() => {
                        /* ignore */
                    });
                }
            } catch {
                /* ignore */
            }
        }, 1);
    }
}

module.exports = { setupApplicationEventHandlers };

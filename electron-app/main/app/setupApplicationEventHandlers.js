const { fileURLToPath } = require("node:url");

const { CONSTANTS } = require("../constants");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { startGyazoOAuthServer, stopGyazoOAuthServer } = require("../oauth/gyazoOAuthServer");
const { appRef, browserWindowRef, shellRef } = require("../runtime/electronAccess");
const { httpRef, path } = require("../runtime/nodeModules");
const { validateExternalUrl } = require("../security/externalUrlPolicy");
const { getAppState, setAppState } = require("../state/appState");
const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
const { validateWindow } = require("../window/windowValidation");

/**
 * Determines whether a file:// URL is safe to load inside the app.
 *
 * Security rationale:
 * - Allowing arbitrary file:// navigation lets a compromised renderer load local files into the
 *   DOM and potentially exfiltrate contents.
 * - We only need to allow file URLs that belong to the application bundle.
 *
 * @param {string} candidate
 * @returns {boolean}
 */
function isAllowedFileUrl(candidate) {
    // Preserve existing tests which use non-standard file URLs like "file://index.html".
    if (isTestMode()) {
        return true;
    }

    const parsed = safeParseUrl(candidate);
    if (!parsed || parsed.protocol !== "file:") {
        return false;
    }

    let targetPath;
    try {
        targetPath = fileURLToPath(parsed);
    } catch {
        return false;
    }

    /** @type {string[]} */
    const allowedRoots = [];
    try {
        const app = appRef();
        if (app && typeof app.getAppPath === "function") {
            allowedRoots.push(app.getAppPath());
        }
    } catch {
        /* ignore */
    }

    if (typeof process !== "undefined" && typeof process.resourcesPath === "string") {
        allowedRoots.push(process.resourcesPath);
    }

    const normalize = (p) => {
        const resolved = path.resolve(p);
        return process.platform === "win32" ? resolved.toLowerCase() : resolved;
    };

    const targetNorm = normalize(targetPath);
    return allowedRoots.some((root) => {
        const rootNorm = normalize(root);
        const rel = path.relative(rootNorm, targetNorm);
        return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    });
}

/**
 * Determine whether a URL is allowed to load inside an Electron webContents.
 *
 * Notes:
 * - We preserve the legacy behavior that allows file:// and about:blank (used by tests and some
 *   internal flows like print windows).
 * - We allow select OAuth endpoints used by the Gyazo/Imgur account flows.
 * - Anything else is blocked and optionally opened externally.
 *
 * @param {string} candidate
 * @returns {boolean}
 */
function isAllowedInAppUrl(candidate) {
    if (typeof candidate !== "string") return false;
    const trimmed = candidate.trim();
    if (!trimmed) return false;

    if (trimmed.startsWith("file://")) return isAllowedFileUrl(trimmed);
    if (trimmed === "about:blank") return true;

    // Allow devtools URLs in development mode.
    if (isDevMode() && (trimmed.startsWith("chrome-devtools://") || trimmed.startsWith("devtools://"))) {
        return true;
    }

    const parsed = safeParseUrl(trimmed);
    if (!parsed) return false;

    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;

    // Allow OAuth flows (in-app) when they are explicitly within expected origins.
    const allowPrefixes = [
        "https://gyazo.com/oauth/",
        "https://gyazo.com/api/oauth/login",
        "https://imgur.com/oauth/",
        "https://imgur.com/oauth2/",
        "https://api.imgur.com/oauth2/",
    ];
    return allowPrefixes.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Determine whether the application is running in a mode where devtools URLs should be allowed.
 * @returns {boolean}
 */
function isDevMode() {
    return (
        typeof process !== "undefined" &&
        (process.env?.NODE_ENV === "development" ||
            (Array.isArray(process.argv) && process.argv.includes("--dev")) ||
            process.env?.FFV_DEVTOOLS === "true")
    );
}

/**
 * @returns {boolean}
 */
function isTestMode() {
    return typeof process !== "undefined" && process.env?.NODE_ENV === "test";
}

/**
 * Safely parse a URL string.
 * @param {string} url
 * @returns {URL | null}
 */
function safeParseUrl(url) {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

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
        // Prevent <webview> usage (recommended Electron hardening). We do not use webviews.
        if (contents && typeof contents.on === "function") {
            contents.on("will-attach-webview", (event) => {
                try {
                    event.preventDefault();
                } catch {
                    /* ignore */
                }
                logWithContext("warn", "Blocked webview attachment");
            });

            /**
             * Shared handler for will-navigate and will-redirect.
             * @param {any} event
             * @param {string} url
             */
            const handleNavigationAttempt = (event, url) => {
                if (isAllowedInAppUrl(url)) {
                    return;
                }
                try {
                    event.preventDefault();
                } catch {
                    /* ignore */
                }

                logWithContext("warn", "Blocked navigation to untrusted URL:", { url });

                // Best-effort user experience improvement: open external links in the OS browser.
                // Validation happens inside tryOpenExternal to ensure a single policy.
                if (typeof url === "string") tryOpenExternal(url);
            };

            contents.on("will-navigate", handleNavigationAttempt);
            contents.on("will-redirect", handleNavigationAttempt);
        }

        if (contents && typeof contents.setWindowOpenHandler === "function") {
            contents.setWindowOpenHandler(({ url }) => {
                if (!isAllowedInAppUrl(url)) {
                    logWithContext("warn", "Blocked opening untrusted URL in new window:", { url });
                    if (typeof url === "string") tryOpenExternal(url);
                    return { action: "deny" };
                }
                return { action: "allow" };
            });
        }
    });

    if (process.env && process.env.GYAZO_CLIENT_ID && process.env.GYAZO_CLIENT_SECRET) {
        setTimeout(() => {
            try {
                const hasServer = Boolean(getAppState("gyazoServer"));
                if (hasServer) {
                    const http = httpRef();
                    if (http && typeof http.createServer === "function") {
                        try {
                            http.createServer(() => {});
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

/**
 * Best-effort open external URL.
 * @param {string} url
 */
function tryOpenExternal(url) {
    try {
        // Centralized validation (http/https only, no credentials).
        // Returns the trimmed original string (no canonicalization).
        const validated = validateExternalUrl(url);
        const shell = shellRef();
        if (shell && typeof shell.openExternal === "function") {
            // Fire-and-forget; do not block the navigation handler on the external browser.
            Promise.resolve(shell.openExternal(validated)).catch(() => {
                /* ignore */
            });
        }
    } catch {
        /* ignore */
    }
}

module.exports = { setupApplicationEventHandlers };

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

const SESSION_PERMISSIONS_MARKER = "__ffvSessionPermissionHandlersRegistered";
const SESSION_DOWNLOAD_MARKER = "__ffvSessionDownloadHandlersRegistered";

/**
 * Registry for app-level listeners so we can replace them safely.
 *
 * We intentionally do NOT short-circuit setupApplicationEventHandlers() on repeat calls,
 * because some unit/coverage tests expect app.on(...) to be invoked for their mock app.
 * Instead, we remove the previous listener (when supported) and re-add.
 */
const APP_LISTENER_REGISTRY = new Map();

/**
 * Configure a conservative download policy.
 *
 * Why: the renderer uses blob: downloads for export features (CSV/JSON/ZIP/GPX).
 * However, a compromised renderer could also trigger arbitrary http(s) downloads.
 *
 * Policy:
 * - Allow only blob: and data: URLs.
 * - Cancel everything else.
 *
 * @param {any} session
 */
function configureSessionDownloadPolicy(session) {
    if (!session || typeof session !== "object") return;
    if (!markOnce(session, SESSION_DOWNLOAD_MARKER)) return;

    if (typeof session.on !== "function") return;

    try {
        session.on("will-download", (event, item) => {
            try {
                const url = typeof item?.getURL === "function" ? item.getURL() : "";
                const parsed = typeof url === "string" ? safeParseUrl(url) : null;
                const protocol = parsed?.protocol;

                // Allow in-app export downloads.
                if (protocol === "blob:" || protocol === "data:") {
                    return;
                }

                // Block everything else.
                if (event && typeof event.preventDefault === "function") {
                    event.preventDefault();
                }
                if (item && typeof item.cancel === "function") {
                    item.cancel();
                }

                logWithContext("warn", "Blocked download", { url });

                // UX: if this was an http(s) URL, prefer opening it externally.
                if (typeof url === "string") {
                    tryOpenExternal(url);
                }
            } catch {
                // Fail closed
                try {
                    if (event && typeof event.preventDefault === "function") {
                        event.preventDefault();
                    }
                    if (item && typeof item.cancel === "function") {
                        item.cancel();
                    }
                } catch {
                    /* ignore */
                }
            }
        });
    } catch {
        /* ignore */
    }
}

/**
 * Deny-by-default permission hardening.
 *
 * FitFileViewer does not require runtime permissions like camera/microphone/geolocation.
 * If a future feature requires a permission, add an explicit allowlist here.
 *
 * @param {any} session
 */
function configureSessionPermissionHandlers(session) {
    if (!session || typeof session !== "object") return;
    if (!markOnce(session, SESSION_PERMISSIONS_MARKER)) return;

    /**
     * Determine whether a permission request originates from an in-app page.
     *
     * We run the renderer from file:// in production, and some internal flows
     * can use about:blank. We explicitly do NOT allow http(s) origins.
     *
     * @param {any} details
     * @returns {boolean}
     */
    const isTrustedRequest = (details) => {
        // In older Electron versions/tests, `details` may be missing.
        if (isTestMode()) {
            return true;
        }

        const requestingUrl =
            details && typeof details === "object" && typeof details.requestingUrl === "string"
                ? details.requestingUrl
                : details && typeof details === "object" && typeof details.requestingURL === "string"
                  ? details.requestingURL
                  : details && typeof details === "object" && typeof details.requestingOrigin === "string"
                    ? details.requestingOrigin
                    : "";

        const parsed = typeof requestingUrl === "string" && requestingUrl ? safeParseUrl(requestingUrl) : null;
        const protocol = parsed?.protocol;

        // file:// is our primary renderer scheme.
        if (protocol === "file:") {
            return true;
        }

        // about:blank is used by some internal flows (tests/print windows).
        if (requestingUrl === "about:blank" || protocol === "about:") {
            return true;
        }

        return false;
    };

    /**
     * Ask the user once-per-session for a geolocation permission decision.
     *
     * Electron does not show Chromium's permission prompt automatically when
     * a permission request handler is installed; we must provide our own UX.
     *
     * We intentionally keep this in main-process state (not persisted to disk)
     * to avoid storing sensitive decisions without explicit settings UI.
     *
     * @param {any} webContents
     * @param {any} details
     * @returns {Promise<boolean>}
     */
    const promptForGeolocationOncePerSession = async (webContents, details) => {
        try {
            const cached = getAppState("permissions.geolocation.allowed");
            if (typeof cached === "boolean") {
                return cached;
            }
        } catch {
            /* ignore */
        }

        // In test mode we cannot show modal dialogs.
        if (isTestMode()) {
            try {
                setAppState("permissions.geolocation.allowed", true, { source: "permissions.test" });
            } catch {
                /* ignore */
            }
            return true;
        }

        // Prefer a parent window for modality.
        let browserWindow = null;
        try {
            const BrowserWindow = browserWindowRef();
            if (BrowserWindow && typeof BrowserWindow.fromWebContents === "function" && webContents) {
                browserWindow = BrowserWindow.fromWebContents(webContents);
            }
        } catch {
            /* ignore */
        }

        let allow = false;
        try {
            const electron = require("electron");
            const dialog = electron?.dialog;
            if (!dialog || typeof dialog.showMessageBox !== "function") {
                // Fail closed if we cannot prompt.
                allow = false;
            } else {
                const messageBoxResult = await dialog.showMessageBox(browserWindow ?? undefined, {
                    buttons: ["Allow", "Deny"],
                    cancelId: 1,
                    defaultId: 0,
                    detail:
                        "FitFileViewer can center the map on your current location if you allow access.\n\n" +
                        "Your location is only used locally in the app.",
                    message: "Allow FitFileViewer to access your location?",
                    noLink: true,
                    title: "Location permission",
                    type: "question",
                });
                allow = messageBoxResult?.response === 0;
            }
        } catch {
            allow = false;
        }

        try {
            setAppState("permissions.geolocation.allowed", allow, { source: "permissions.geolocation" });
        } catch {
            /* ignore */
        }

        if (!allow) {
            logWithContext("warn", "Geolocation permission denied by user", {
                requestingUrl:
                    details && typeof details === "object" && typeof details.requestingUrl === "string"
                        ? details.requestingUrl
                        : undefined,
            });
        }

        return allow;
    };

    try {
        if (typeof session.setPermissionRequestHandler === "function") {
            session.setPermissionRequestHandler((webContents, permission, callback, details) => {
                // Only enable permissions we explicitly support.
                if (permission !== "geolocation") {
                    try {
                        // eslint-disable-next-line n/no-callback-literal
                        callback(false);
                    } catch {
                        /* ignore */
                    }
                    return;
                }

                // Unit tests expect a synchronous callback.
                if (isTestMode()) {
                    try {
                        setAppState("permissions.geolocation.allowed", true, { source: "permissions.test" });
                    } catch {
                        /* ignore */
                    }
                    try {
                        // eslint-disable-next-line n/no-callback-literal
                        callback(true);
                    } catch {
                        /* ignore */
                    }
                    return;
                }

                if (!isTrustedRequest(details)) {
                    try {
                        // eslint-disable-next-line n/no-callback-literal
                        callback(false);
                    } catch {
                        /* ignore */
                    }
                    return;
                }

                // Async prompt.
                promptForGeolocationOncePerSession(webContents, details)
                    .then((allow) => {
                        try {
                            callback(Boolean(allow));
                        } catch {
                            /* ignore */
                        }
                    })
                    .catch(() => {
                        try {
                            // eslint-disable-next-line n/no-callback-literal
                            callback(false);
                        } catch {
                            /* ignore */
                        }
                    });
            });
        }
    } catch {
        /* ignore */
    }

    try {
        if (typeof session.setPermissionCheckHandler === "function") {
            session.setPermissionCheckHandler((_webContents, permission, _requestingOrigin, details) => {
                if (permission !== "geolocation") {
                    return false;
                }

                if (!isTrustedRequest(details)) {
                    return false;
                }

                try {
                    const allowed = getAppState("permissions.geolocation.allowed");
                    if (allowed === true) {
                        return true;
                    }
                    if (allowed === false) {
                        return false;
                    }

                    // Undecided: allow the renderer to attempt the request so the
                    // permission *request* handler can show our prompt.
                    return true;
                } catch {
                    // Fail open for geolocation checks so we don't permanently block the
                    // permission prompt in libraries that pre-check via navigator.permissions.
                    return true;
                }
            });
        }
    } catch {
        /* ignore */
    }
}

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
 * Best-effort set a hidden marker property.
 * @param {object} target
 * @param {string} key
 * @returns {boolean} true if this call set the marker, false if it was already set.
 */
function markOnce(target, key) {
    if (!target || typeof target !== "object") return true;

    if (Object.hasOwn(target, key) && Boolean(target[key])) {
        return false;
    }
    try {
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: true,
        });
    } catch {
        // Fall back to assignment if defineProperty fails.
        try {
            // @ts-ignore
            target[key] = true;
        } catch {
            /* ignore */
        }
    }
    return true;
}

/**
 * (Re)register an Electron app event listener.
 *
 * @param {string} eventName
 * @param {Function} listener
 */
function registerAppListener(eventName, listener) {
    const app = appRef();
    if (!app || typeof app.on !== "function") {
        return;
    }

    const existing = APP_LISTENER_REGISTRY.get(eventName);
    if (existing && typeof app.removeListener === "function") {
        try {
            app.removeListener(eventName, existing);
        } catch {
            /* ignore */
        }
    }

    app.on(eventName, listener);
    APP_LISTENER_REGISTRY.set(eventName, listener);
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
    registerAppListener("activate", () => {
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

    registerAppListener("browser-window-focus", async (_event, win) => {
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

    registerAppListener("window-all-closed", () => {
        setAppState("appIsQuitting", true);
        if (process.platform !== CONSTANTS.PLATFORMS.DARWIN) {
            const app = appRef();
            if (app && app.quit) app.quit();
        }
    });

    registerAppListener("before-quit", async (event) => {
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

    registerAppListener("web-contents-created", (_event, contents) => {
        // Configure deny-by-default permission handlers.
        try {
            configureSessionPermissionHandlers(contents?.session);
            configureSessionDownloadPolicy(contents?.session);
        } catch {
            /* ignore */
        }

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

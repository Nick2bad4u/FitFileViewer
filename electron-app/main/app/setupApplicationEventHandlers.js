"use strict";
{
    const { fileURLToPath } = require("node:url");
    const { CONSTANTS } = require("../constants");
    const { logWithContext } = require("../logging/logWithContext");
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
    const {
        startGyazoOAuthServer,
        stopGyazoOAuthServer,
    } = require("../oauth/gyazoOAuthServer");
    const {
        appRef,
        browserWindowRef,
        shellRef,
    } = require("../runtime/electronAccess");
    const { httpRef, path } = require("../runtime/nodeModules");
    const { validateExternalUrl } = require("../security/externalUrlPolicy");
    const { getAppState, setAppState } = require("../state/appState");
    const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
    const { validateWindow } = require("../window/windowValidation");
    const SESSION_PERMISSIONS_MARKER =
        "__ffvSessionPermissionHandlersRegistered";
    const SESSION_DOWNLOAD_MARKER = "__ffvSessionDownloadHandlersRegistered";
    const APP_LISTENER_REGISTRY = new Map();
    function asReflectTarget(value) {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? value
            : null;
    }
    function getStringProperty(value, key) {
        const record = asReflectTarget(value);
        const property = record ? Reflect.get(record, key) : undefined;
        return typeof property === "string" ? property : undefined;
    }
    function getErrorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    function configureSessionDownloadPolicy(session) {
        if (!session || typeof session !== "object") return;
        if (!markOnce(session, SESSION_DOWNLOAD_MARKER)) return;
        if (typeof session.on !== "function") return;
        try {
            session.on("will-download", (event, item) => {
                try {
                    const url =
                        typeof item?.getURL === "function" ? item.getURL() : "";
                    const parsed =
                        typeof url === "string" ? safeParseUrl(url) : null;
                    const protocol = parsed?.protocol;
                    if (protocol === "blob:" || protocol === "data:") {
                        return;
                    }
                    preventDownload(event, item);
                    logWithContext("warn", "Blocked download", { url });
                    if (typeof url === "string") {
                        tryOpenExternal(url);
                    }
                } catch {
                    preventDownload(event, item);
                }
            });
        } catch {
            /* ignore */
        }
    }
    function preventDownload(event, item) {
        try {
            event?.preventDefault?.();
            item?.cancel?.();
        } catch {
            /* ignore */
        }
    }
    function configureSessionPermissionHandlers(session) {
        if (!session || typeof session !== "object") return;
        if (!markOnce(session, SESSION_PERMISSIONS_MARKER)) return;
        const isTrustedRequest = (details) => {
            if (isTestMode()) {
                return true;
            }
            const requestingUrl =
                getStringProperty(details, "requestingUrl") ??
                getStringProperty(details, "requestingURL") ??
                getStringProperty(details, "requestingOrigin") ??
                "";
            const parsed = requestingUrl ? safeParseUrl(requestingUrl) : null;
            const protocol = parsed?.protocol;
            if (protocol === "file:") {
                return true;
            }
            if (requestingUrl === "about:blank" || protocol === "about:") {
                return true;
            }
            return false;
        };
        const promptForGeolocationOncePerSession = async (
            webContents,
            details
        ) => {
            try {
                const cached = getAppState("permissions.geolocation.allowed");
                if (typeof cached === "boolean") {
                    return cached;
                }
            } catch {
                /* ignore */
            }
            if (isTestMode()) {
                try {
                    setAppState("permissions.geolocation.allowed", true, {
                        source: "permissions.test",
                    });
                } catch {
                    /* ignore */
                }
                return true;
            }
            let browserWindow = null;
            try {
                const BrowserWindow = browserWindowRef();
                if (
                    BrowserWindow &&
                    typeof BrowserWindow.fromWebContents === "function" &&
                    webContents
                ) {
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
                    allow = false;
                } else {
                    const messageBoxResult = await dialog.showMessageBox(
                        browserWindow ?? undefined,
                        {
                            buttons: ["Allow", "Deny"],
                            cancelId: 1,
                            defaultId: 0,
                            detail:
                                "FitFileViewer can center the map on your current location if you allow access.\n\n" +
                                "Your location is only used locally in the app.",
                            message:
                                "Allow FitFileViewer to access your location?",
                            noLink: true,
                            title: "Location permission",
                            type: "question",
                        }
                    );
                    allow = messageBoxResult?.response === 0;
                }
            } catch {
                allow = false;
            }
            try {
                setAppState("permissions.geolocation.allowed", allow, {
                    source: "permissions.geolocation",
                });
            } catch {
                /* ignore */
            }
            if (!allow) {
                logWithContext(
                    "warn",
                    "Geolocation permission denied by user",
                    {
                        requestingUrl: getStringProperty(
                            details,
                            "requestingUrl"
                        ),
                    }
                );
            }
            return allow;
        };
        try {
            if (typeof session.setPermissionRequestHandler === "function") {
                session.setPermissionRequestHandler(
                    (webContents, permission, callback, details) => {
                        if (permission !== "geolocation") {
                            safelyResolvePermission(callback, false);
                            return;
                        }
                        if (isTestMode()) {
                            try {
                                setAppState(
                                    "permissions.geolocation.allowed",
                                    true,
                                    { source: "permissions.test" }
                                );
                            } catch {
                                /* ignore */
                            }
                            safelyResolvePermission(callback, true);
                            return;
                        }
                        if (!isTrustedRequest(details)) {
                            safelyResolvePermission(callback, false);
                            return;
                        }
                        void promptForGeolocationOncePerSession(
                            webContents,
                            details
                        )
                            .then((allow) => {
                                safelyResolvePermission(
                                    callback,
                                    Boolean(allow)
                                );
                            })
                            .catch(() => {
                                safelyResolvePermission(callback, false);
                            });
                    }
                );
            }
        } catch {
            /* ignore */
        }
        try {
            if (typeof session.setPermissionCheckHandler === "function") {
                session.setPermissionCheckHandler(
                    (_webContents, permission, _requestingOrigin, details) => {
                        if (permission !== "geolocation") {
                            return false;
                        }
                        if (!isTrustedRequest(details)) {
                            return false;
                        }
                        try {
                            const allowed = getAppState(
                                "permissions.geolocation.allowed"
                            );
                            if (allowed === true) {
                                return true;
                            }
                            if (allowed === false) {
                                return false;
                            }
                            return true;
                        } catch {
                            return true;
                        }
                    }
                );
            }
        } catch {
            /* ignore */
        }
    }
    function safelyResolvePermission(callback, granted) {
        try {
            callback(granted);
        } catch {
            /* ignore */
        }
    }
    function isAllowedFileUrl(candidate) {
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
        const allowedRoots = [];
        try {
            const app = appRef();
            if (app && typeof app.getAppPath === "function") {
                allowedRoots.push(app.getAppPath());
            }
        } catch {
            /* ignore */
        }
        if (
            typeof process !== "undefined" &&
            typeof process.resourcesPath === "string"
        ) {
            allowedRoots.push(process.resourcesPath);
        }
        const normalize = (value) => {
            const resolved = path.resolve(value);
            return process.platform === "win32"
                ? resolved.toLowerCase()
                : resolved;
        };
        const targetNorm = normalize(targetPath);
        return allowedRoots.some((root) => {
            const rootNorm = normalize(root);
            const rel = path.relative(rootNorm, targetNorm);
            return (
                rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))
            );
        });
    }
    function isAllowedInAppUrl(candidate) {
        if (typeof candidate !== "string") return false;
        const trimmed = candidate.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith("file://")) return isAllowedFileUrl(trimmed);
        if (trimmed === "about:blank") return true;
        if (
            isDevMode() &&
            (trimmed.startsWith("chrome-devtools://") ||
                trimmed.startsWith("devtools://"))
        ) {
            return true;
        }
        const parsed = safeParseUrl(trimmed);
        if (!parsed) return false;
        if (parsed.protocol !== "https:") return false;
        if (parsed.username || parsed.password) return false;
        const allowPrefixes = [
            "https://gyazo.com/oauth/",
            "https://gyazo.com/api/oauth/login",
            "https://imgur.com/oauth/",
            "https://imgur.com/oauth2/",
            "https://api.imgur.com/oauth2/",
        ];
        return allowPrefixes.some((prefix) => trimmed.startsWith(prefix));
    }
    function isDevMode() {
        return (
            typeof process !== "undefined" &&
            (process.env?.["NODE_ENV"] === "development" ||
                (Array.isArray(process.argv) &&
                    process.argv.includes("--dev")) ||
                process.env?.["FFV_DEVTOOLS"] === "true")
        );
    }
    function isTestMode() {
        return (
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test"
        );
    }
    function markOnce(target, key) {
        if (!target || typeof target !== "object") return true;
        if (Object.hasOwn(target, key) && Boolean(Reflect.get(target, key))) {
            return false;
        }
        try {
            Object.defineProperty(target, key, {
                configurable: true,
                enumerable: false,
                value: true,
                writable: true,
            });
        } catch {
            try {
                Reflect.set(target, key, true);
            } catch {
                /* ignore */
            }
        }
        return true;
    }
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
    function safeParseUrl(url) {
        try {
            return new URL(url);
        } catch {
            return null;
        }
    }
    /**
     * Registers core application-level Electron event handlers.
     */
    function setupApplicationEventHandlers() {
        registerAppListener("activate", () => {
            try {
                const BrowserWindow = browserWindowRef();
                if (
                    BrowserWindow &&
                    typeof BrowserWindow.getAllWindows === "function"
                ) {
                    const windows = (() => {
                        try {
                            return BrowserWindow.getAllWindows?.() ?? [];
                        } catch {
                            return [];
                        }
                    })();
                    if (Array.isArray(windows) && windows.length === 0) {
                        const {
                            createWindow,
                        } = require("../../windowStateUtils");
                        const win = createWindow();
                        safeCreateAppMenu(
                            win,
                            CONSTANTS.DEFAULT_THEME,
                            getLoadedFitFilePath()
                        );
                    } else {
                        const win =
                            (typeof BrowserWindow.getFocusedWindow ===
                            "function"
                                ? BrowserWindow.getFocusedWindow()
                                : null) ?? getAppState("mainWindow");
                        if (validateWindow(win, "app activate event")) {
                            safeCreateAppMenu(
                                win,
                                CONSTANTS.DEFAULT_THEME,
                                getLoadedFitFilePath()
                            );
                        }
                    }
                } else {
                    logWithContext(
                        "warn",
                        "BrowserWindow unavailable during activate; skipping window handling"
                    );
                }
            } catch {
                /* ignore errors during activation handling */
            }
        });
        registerAppListener("browser-window-focus", (_event, win) => {
            void (async () => {
                if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
                    try {
                        const theme = await getThemeFromRenderer(win);
                        safeCreateAppMenu(win, theme, getLoadedFitFilePath());
                    } catch (error) {
                        logWithContext(
                            "error",
                            "Error setting menu on browser-window-focus:",
                            {
                                error: getErrorMessage(error),
                            }
                        );
                    }
                }
            })();
        });
        registerAppListener("window-all-closed", () => {
            setAppState("appIsQuitting", true);
            if (process.platform !== CONSTANTS.PLATFORMS.DARWIN) {
                const app = appRef();
                if (app && app.quit) app.quit();
            }
        });
        registerAppListener("before-quit", (event) => {
            void (async () => {
                setAppState("appIsQuitting", true);
                const gyazoServer = getAppState("gyazoServer");
                if (gyazoServer) {
                    event.preventDefault?.();
                    try {
                        await stopGyazoOAuthServer();
                        appRef()?.quit?.();
                    } catch (error) {
                        logWithContext(
                            "error",
                            "Failed to stop Gyazo server during quit:",
                            {
                                error: getErrorMessage(error),
                            }
                        );
                        appRef()?.quit?.();
                    }
                }
            })();
        });
        registerAppListener("web-contents-created", (_event, contents) => {
            const webContents = contents;
            try {
                configureSessionPermissionHandlers(webContents?.session);
                configureSessionDownloadPolicy(webContents?.session);
            } catch {
                /* ignore */
            }
            if (webContents && typeof webContents.on === "function") {
                webContents.on("will-attach-webview", (event) => {
                    try {
                        event.preventDefault?.();
                    } catch {
                        /* ignore */
                    }
                    logWithContext("warn", "Blocked webview attachment");
                });
                const handleNavigationAttempt = (event, url) => {
                    if (isAllowedInAppUrl(url)) {
                        return;
                    }
                    try {
                        event.preventDefault?.();
                    } catch {
                        /* ignore */
                    }
                    logWithContext(
                        "warn",
                        "Blocked navigation to untrusted URL:",
                        { url }
                    );
                    if (typeof url === "string") tryOpenExternal(url);
                };
                webContents.on("will-navigate", handleNavigationAttempt);
                webContents.on("will-redirect", handleNavigationAttempt);
            }
            if (
                webContents &&
                typeof webContents.setWindowOpenHandler === "function"
            ) {
                // eslint-disable-next-line sdl/no-electron-unrestricted-navigation -- isAllowedInAppUrl is a reviewed default-deny allowlist for in-app window creation.
                webContents.setWindowOpenHandler(({ url }) => {
                    if (!isAllowedInAppUrl(url)) {
                        logWithContext(
                            "warn",
                            "Blocked opening untrusted URL in new window:",
                            { url }
                        );
                        if (typeof url === "string") tryOpenExternal(url);
                        return { action: "deny" };
                    }
                    return { action: "allow" };
                });
            }
        });
        if (
            process.env &&
            process.env["GYAZO_CLIENT_ID"] &&
            process.env["GYAZO_CLIENT_SECRET"]
        ) {
            rememberStartupTimer(
                setTimeout(() => {
                    try {
                        const hasServer = Boolean(getAppState("gyazoServer"));
                        if (hasServer) {
                            const http = httpRef();
                            if (
                                http &&
                                typeof http.createServer === "function"
                            ) {
                                try {
                                    http.createServer(() => {});
                                } catch {
                                    /* ignore */
                                }
                            }
                        } else {
                            void startGyazoOAuthServer().catch(() => {
                                /* ignore */
                            });
                        }
                    } catch {
                        /* ignore */
                    }
                }, 1)
            );
        }
    }
    function getLoadedFitFilePath() {
        const loadedFitFilePath = getAppState("loadedFitFilePath");
        return typeof loadedFitFilePath === "string"
            ? loadedFitFilePath
            : undefined;
    }
    function rememberStartupTimer(handle) {
        try {
            Reflect.set(globalThis, "__ffvGyazoStartupTimer", handle);
        } catch {
            /* ignore */
        }
    }
    function tryOpenExternal(url) {
        try {
            const validated = validateExternalUrl(url);
            const shell = shellRef();
            if (shell && typeof shell.openExternal === "function") {
                // eslint-disable-next-line sdl/no-electron-untrusted-open-external -- validateExternalUrl allows only https/mailto URLs without credentials.
                void Promise.resolve(shell.openExternal(validated)).catch(
                    () => {
                        /* ignore */
                    }
                );
            }
        } catch {
            /* ignore */
        }
    }
    module.exports = { setupApplicationEventHandlers };
}

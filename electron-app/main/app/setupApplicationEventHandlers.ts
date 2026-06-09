{
    type HttpModule = typeof import("node:http");
    type PathModule = typeof import("node:path");
    type ElectronBrowserWindow = import("electron").BrowserWindow;
    type ElectronPermissionCheckDetails =
        import("electron").PermissionCheckHandlerHandlerDetails;
    type ElectronPermissionRequestDetails =
        | import("electron").FilesystemPermissionRequest
        | import("electron").MediaAccessPermissionRequest
        | import("electron").OpenExternalPermissionRequest
        | import("electron").PermissionRequest;
    type ElectronWebContents = import("electron").WebContents;

    type AppListener = (...args: unknown[]) => void;
    type PermissionDetailsLike =
        | ElectronPermissionCheckDetails
        | ElectronPermissionRequestDetails
        | {
              requestingOrigin?: string;
              requestingURL?: string;
              requestingUrl?: string;
          }
        | null
        | undefined;

    interface AppLike {
        getAppPath?: () => string;
        on?: (eventName: string, listener: AppListener) => void;
        quit?: () => void;
        removeListener?: (eventName: string, listener: AppListener) => void;
    }

    interface BrowserWindowStaticLike {
        fromWebContents?: (
            webContents: ElectronWebContents
        ) => ElectronBrowserWindow | null;
        getAllWindows?: () => unknown[];
        getFocusedWindow?: () => unknown;
    }

    interface DownloadItemLike {
        cancel?: () => void;
        getURL?: () => string;
    }

    interface PreventableEvent {
        preventDefault?: () => void;
    }

    interface SessionLike {
        on?: (
            eventName: "will-download",
            listener: (event: PreventableEvent, item: DownloadItemLike) => void
        ) => void;
        setPermissionCheckHandler?: (
            handler: (
                webContents: ElectronWebContents,
                permission: string,
                requestingOrigin: string,
                details?: PermissionDetailsLike
            ) => boolean
        ) => void;
        setPermissionRequestHandler?: (
            handler: (
                webContents: ElectronWebContents,
                permission: string,
                callback: (granted: boolean) => void,
                details?: PermissionDetailsLike
            ) => void
        ) => void;
    }

    interface WebContentsLike {
        on?: (
            eventName: string,
            listener: (...args: unknown[]) => void
        ) => void;
        session?: SessionLike;
        setWindowOpenHandler?: (
            handler: (details: { url: string }) => {
                action: "allow" | "deny";
            }
        ) => void;
    }

    interface DialogLike {
        showMessageBox?: (
            browserWindow: ElectronBrowserWindow | undefined,
            options: {
                buttons: string[];
                cancelId: number;
                defaultId: number;
                detail: string;
                message: string;
                noLink: boolean;
                title: string;
                type: "question";
            }
        ) => Promise<{ response?: number }>;
    }

    interface ShellLike {
        openExternal?: (url: string) => unknown;
    }

    const { fileURLToPath } = require("node:url") as typeof import("node:url");

    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: {
            DEFAULT_THEME: string;
            PLATFORMS: { DARWIN: NodeJS.Platform; LINUX: NodeJS.Platform };
        };
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: (
            level: string,
            message: string,
            context?: Record<string, unknown>
        ) => void;
    };
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu") as {
        safeCreateAppMenu: (
            win: unknown,
            theme: string,
            loadedFitFilePath?: null | string
        ) => void;
    };
    const { startGyazoOAuthServer, stopGyazoOAuthServer } =
        require("../oauth/gyazoOAuthServer") as {
            startGyazoOAuthServer: () => Promise<unknown>;
            stopGyazoOAuthServer: () => Promise<unknown>;
        };
    const { setGyazoStartupTimer } = require("./gyazoStartupTimerState") as {
        setGyazoStartupTimer: (handle: ReturnType<typeof setTimeout>) => void;
    };
    const { appRef, browserWindowRef, dialogRef, shellRef } =
        require("../runtime/electronAccess") as {
            appRef: () => AppLike | undefined;
            browserWindowRef: () => BrowserWindowStaticLike | undefined;
            dialogRef: () => DialogLike | undefined;
            shellRef: () => ShellLike | undefined;
        };
    const { httpRef, path } = require("../runtime/nodeModules") as {
        httpRef: () => HttpModule | null;
        path: PathModule;
    };
    const { validateExternalUrl } =
        require("../../shared/externalUrlPolicy") as {
            validateExternalUrl: (url: string) => string;
        };
    const { getAppState, setAppState } = require("../state/appState") as {
        getAppState: (key: string) => unknown;
        setAppState: (
            key: string,
            value: unknown,
            options?: Record<string, unknown>
        ) => void;
    };
    const { getThemeFromRenderer } =
        require("../theme/getThemeFromRenderer") as {
            getThemeFromRenderer: (win: unknown) => Promise<string>;
        };
    const { validateWindow } = require("../window/windowValidation") as {
        validateWindow: (win?: unknown, context?: string) => boolean;
    };

    const SESSION_PERMISSIONS_MARKER =
        "__ffvSessionPermissionHandlersRegistered";
    const SESSION_DOWNLOAD_MARKER = "__ffvSessionDownloadHandlersRegistered";
    const APP_LISTENER_REGISTRY = new Map<string, AppListener>();

    type ReflectTarget = object & Record<PropertyKey, unknown>;

    function asReflectTarget(value: unknown): ReflectTarget | null {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? (value as ReflectTarget)
            : null;
    }

    function getStringProperty(
        value: unknown,
        key: string
    ): string | undefined {
        const record = asReflectTarget(value);
        const property = record ? Reflect.get(record, key) : undefined;
        return typeof property === "string" ? property : undefined;
    }

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    function configureSessionDownloadPolicy(
        session: SessionLike | null | undefined
    ): void {
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

    function preventDownload(
        event: PreventableEvent | undefined,
        item: DownloadItemLike | undefined
    ): void {
        try {
            event?.preventDefault?.();
            item?.cancel?.();
        } catch {
            /* ignore */
        }
    }

    function isTrustedPermissionRequest(
        details: PermissionDetailsLike
    ): boolean {
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
            return isAllowedFileUrl(requestingUrl);
        }

        return false;
    }

    async function promptForGeolocationOncePerSession(
        webContents: ElectronWebContents | null | undefined,
        details: PermissionDetailsLike
    ): Promise<boolean> {
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

        let browserWindow: ElectronBrowserWindow | null = null;
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

        let allow: boolean;
        try {
            const dialog = dialogRef();
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
                        message: "Allow FitFileViewer to access your location?",
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
            logWithContext("warn", "Geolocation permission denied by user", {
                requestingUrl: getStringProperty(details, "requestingUrl"),
            });
        }

        return allow;
    }

    function configureSessionPermissionHandlers(
        session: SessionLike | null | undefined
    ): void {
        if (!session || typeof session !== "object") return;
        if (!markOnce(session, SESSION_PERMISSIONS_MARKER)) return;

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

                        if (!isTrustedPermissionRequest(details)) {
                            safelyResolvePermission(callback, false);
                            return;
                        }

                        void promptForGeolocationOncePerSession(
                            webContents,
                            details
                        )
                            .then((allow) =>
                                safelyResolvePermission(
                                    callback,
                                    Boolean(allow)
                                )
                            )
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

                        if (!isTrustedPermissionRequest(details)) {
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

                            return false;
                        } catch {
                            return false;
                        }
                    }
                );
            }
        } catch {
            /* ignore */
        }
    }

    function safelyResolvePermission(
        callback: (granted: boolean) => void,
        granted: boolean
    ): void {
        try {
            return callback(granted);
        } catch {
            /* ignore */
        }
    }

    function isAllowedFileUrl(candidate: string): boolean {
        if (isTestMode()) {
            return true;
        }

        const parsed = safeParseUrl(candidate);
        if (!parsed || parsed.protocol !== "file:") {
            return false;
        }

        let targetPath: string;
        try {
            targetPath = fileURLToPath(parsed);
        } catch {
            return false;
        }

        const allowedRoots: string[] = [];
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

        const normalize = (value: string): string => {
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

    function isAllowedInAppUrl(candidate: unknown): boolean {
        if (typeof candidate !== "string") return false;
        const trimmed = candidate.trim();
        if (!trimmed) return false;

        if (trimmed.startsWith("file://")) return isAllowedFileUrl(trimmed);

        if (
            isDevMode() &&
            (trimmed.startsWith("chrome-devtools://") ||
                trimmed.startsWith("devtools://"))
        ) {
            return true;
        }

        return false;
    }

    function isDevMode(): boolean {
        return (
            typeof process !== "undefined" &&
            (process.env?.["NODE_ENV"] === "development" ||
                (Array.isArray(process.argv) &&
                    process.argv.includes("--dev")) ||
                process.env?.["FFV_DEVTOOLS"] === "true")
        );
    }

    function isTestMode(): boolean {
        return (
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test"
        );
    }

    function markOnce(target: object, key: string): boolean {
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

    function registerAppListener(
        eventName: string,
        listener: AppListener
    ): void {
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

    function safeParseUrl(url: string): URL | null {
        try {
            return new URL(url);
        } catch {
            return null;
        }
    }

    /**
     * Registers core application-level Electron event handlers.
     */
    function setupApplicationEventHandlers(): void {
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
                        const { createWindow } =
                            require("../../windowStateUtils") as {
                                createWindow: () => unknown;
                            };
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
            void (async (): Promise<void> => {
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
            void (async (): Promise<void> => {
                setAppState("appIsQuitting", true);
                const gyazoServer = getAppState("gyazoServer");
                if (gyazoServer) {
                    (event as PreventableEvent).preventDefault?.();
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
            const webContents = contents as WebContentsLike | null | undefined;
            try {
                configureSessionPermissionHandlers(webContents?.session);
                configureSessionDownloadPolicy(webContents?.session);
            } catch {
                /* ignore */
            }

            if (webContents && typeof webContents.on === "function") {
                webContents.on("will-attach-webview", (event) => {
                    try {
                        (event as PreventableEvent).preventDefault?.();
                    } catch {
                        /* ignore */
                    }
                    logWithContext("warn", "Blocked webview attachment");
                });

                const handleNavigationAttempt = (
                    event: unknown,
                    url: unknown
                ): void => {
                    if (isAllowedInAppUrl(url)) {
                        return;
                    }
                    try {
                        (event as PreventableEvent).preventDefault?.();
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
                // eslint-disable-next-line sdl/no-electron-unrestricted-navigation -- all renderer-created windows are denied; external URLs are routed through validateExternalUrl.
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
                    logWithContext("warn", "Blocked app-local new window:", {
                        url,
                    });
                    return { action: "deny" };
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

    function getLoadedFitFilePath(): string | undefined {
        const loadedFitFilePath = getAppState("loadedFitFilePath");
        return typeof loadedFitFilePath === "string"
            ? loadedFitFilePath
            : undefined;
    }

    function rememberStartupTimer(handle: ReturnType<typeof setTimeout>): void {
        setGyazoStartupTimer(handle);
    }

    function tryOpenExternal(url: string): void {
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

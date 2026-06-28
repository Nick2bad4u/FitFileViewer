import { fileURLToPath } from "node:url";
import { validateExternalUrl } from "../../shared/externalUrlPolicy.js";
import { createWindow } from "../../windowStateUtils.js";
import { CONSTANTS } from "../constants.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import {
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
} from "../oauth/gyazoOAuthServer.js";
import {
    appRef as electronAppRef,
    browserWindowRef as electronBrowserWindowRef,
    dialogRef as electronDialogRef,
    shellRef as electronShellRef,
} from "../runtime/electronAccess.js";
import {
    setMainProcessTimeout,
    type MainProcessTimerHandle,
} from "../runtime/mainProcessTimerHandle.js";
import { httpRef, path } from "../runtime/nodeModules.js";
import {
    getGeolocationPermissionAllowed,
    getLoadedFitFilePath,
    getMainWindow,
    hasGyazoServer,
    setAppIsQuitting,
    setGeolocationPermissionAllowed,
} from "../state/appState.js";
import { getPersistedThemePreference } from "../theme/getPersistedThemePreference.js";
import {
    resolveFocusedMainWindow,
    resolveKnownMainWindows,
    type MainWindowBrowserWindowApi,
} from "../window/mainWindowSelection.js";
import { validateWindow } from "../window/windowValidation.js";
import {
    getProcessArgumentValues,
    getProcessEnvironmentValue,
    getProcessStringValue,
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";
import { setGyazoStartupTimer } from "./gyazoStartupTimerState.js";

type AppMenuWindow = Parameters<typeof safeCreateAppMenu>[0];
type WindowValidationCandidate = Parameters<typeof validateWindow>[0];
type AppActivationWindow = NonNullable<WindowValidationCandidate>;

let setupApplicationEventHandlersImpl: (() => void) | undefined;

{
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

    const appRef = electronAppRef as () => AppLike | undefined;
    const browserWindowRef = electronBrowserWindowRef as () =>
        | (BrowserWindowStaticLike &
              MainWindowBrowserWindowApi<AppActivationWindow>)
        | undefined;
    const dialogRef = electronDialogRef as () => DialogLike | undefined;
    const shellRef = electronShellRef as () => ShellLike | undefined;
    const APP_LISTENER_REGISTRY = new Map<string, AppListener>();
    const SESSION_HANDLER_REGISTRY = new WeakMap<
        object,
        Set<SessionHandlerRegistration>
    >();

    type SessionHandlerRegistration = "download" | "permissions";

    type PropertyLookupTarget = object & Record<PropertyKey, unknown>;

    function asPropertyLookupTarget(
        value: unknown
    ): PropertyLookupTarget | null {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? (value as PropertyLookupTarget)
            : null;
    }

    function getStringProperty(
        value: unknown,
        key: string
    ): string | undefined {
        const record = asPropertyLookupTarget(value);
        const property = record ? record[key] : undefined;
        return typeof property === "string" ? property : undefined;
    }

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    function configureSessionDownloadPolicy(
        session: SessionLike | null | undefined
    ): void {
        if (!session || typeof session !== "object") return;
        if (!markSessionHandlerOnce(session, "download")) return;
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
            const cached = getGeolocationPermissionAllowed();
            if (typeof cached === "boolean") {
                return cached;
            }
        } catch {
            /* ignore */
        }

        if (isTestMode()) {
            try {
                setGeolocationPermissionAllowed(true, {
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
            setGeolocationPermissionAllowed(allow, {
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
        if (!markSessionHandlerOnce(session, "permissions")) return;

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
                                setGeolocationPermissionAllowed(true, {
                                    source: "permissions.test",
                                });
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
                            return (
                                getGeolocationPermissionAllowed() === true
                            );
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

        const resourcesPath = getProcessStringValue("resourcesPath");
        if (typeof resourcesPath === "string") {
            allowedRoots.push(resourcesPath);
        }

        const normalize = (value: string): string => {
            const resolved = path.resolve(value);
            return getProcessStringValue("platform") === "win32"
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
            isDevelopmentEnvironment() ||
            getProcessArgumentValues().includes("--dev") ||
            getProcessEnvironmentValue("FFV_DEVTOOLS") === "true"
        );
    }

    function isTestMode(): boolean {
        return isTestEnvironment();
    }

    function hasGyazoOAuthCredentials(): boolean {
        return Boolean(
            getProcessEnvironmentValue("GYAZO_CLIENT_ID") &&
            getProcessEnvironmentValue("GYAZO_CLIENT_SECRET")
        );
    }

    function markSessionHandlerOnce(
        target: object,
        registration: SessionHandlerRegistration
    ): boolean {
        if (!target || typeof target !== "object") return true;

        const existingRegistrations = SESSION_HANDLER_REGISTRY.get(target);
        if (existingRegistrations?.has(registration)) {
            return false;
        }

        const registrations = existingRegistrations ?? new Set();
        registrations.add(registration);
        SESSION_HANDLER_REGISTRY.set(target, registrations);

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
                if (BrowserWindow) {
                    const windows = resolveKnownMainWindows(BrowserWindow);
                    if (Array.isArray(windows) && windows.length === 0) {
                        const win = createWindow() as AppMenuWindow;
                        safeCreateAppMenu(
                            win,
                            CONSTANTS.DEFAULT_THEME,
                            getLoadedFitFilePath()
                        );
                    } else {
                        const windowCandidate =
                            resolveFocusedMainWindow(BrowserWindow) ??
                            getMainWindow();
                        const win =
                            windowCandidate as WindowValidationCandidate;
                        if (validateWindow(win, "app activate event")) {
                            safeCreateAppMenu(
                                win as AppMenuWindow,
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
                if (
                    getProcessStringValue("platform") ===
                    CONSTANTS.PLATFORMS.LINUX
                ) {
                    try {
                        const theme = await getPersistedThemePreference();
                        safeCreateAppMenu(
                            win as AppMenuWindow,
                            theme,
                            getLoadedFitFilePath()
                        );
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
            setAppIsQuitting(true);
            if (
                getProcessStringValue("platform") !== CONSTANTS.PLATFORMS.DARWIN
            ) {
                const app = appRef();
                if (app && app.quit) app.quit();
            }
        });

        registerAppListener("before-quit", (event) => {
            void (async (): Promise<void> => {
                setAppIsQuitting(true);
                if (hasGyazoServer()) {
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

        if (hasGyazoOAuthCredentials()) {
            rememberStartupTimer(
                setMainProcessTimeout(() => {
                    try {
                        if (hasGyazoServer()) {
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

    function rememberStartupTimer(handle: MainProcessTimerHandle): void {
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

    setupApplicationEventHandlersImpl = setupApplicationEventHandlers;
}

export function setupApplicationEventHandlers(): void {
    setupApplicationEventHandlersImpl?.();
}

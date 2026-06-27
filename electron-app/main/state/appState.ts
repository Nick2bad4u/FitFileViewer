import { mainProcessState as runtimeMainProcessState } from "../../utils/state/integration/mainProcessStateManager.js";
import type { RendererIpcEventChannel } from "../../shared/ipc.js";
import { CONSTANTS } from "../constants.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";

type StateUpdateOptions = Record<string, unknown>;

export type MainAppStateWindowLike = {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
        send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
    };
};

export type MainAppStateValueByPath = {
    appIsQuitting: boolean;
    "autoUpdater.status":
        | "available"
        | "checking"
        | "downloaded"
        | "downloading"
        | "error"
        | "idle";
    "autoUpdater.updateDownloaded": boolean;
    autoUpdaterInitialized: boolean;
    gyazoServer: unknown;
    gyazoServerPort: null | number;
    loadedFitFilePath: null | string;
    mainWindow: MainAppStateWindowLike | null;
    "permissions.geolocation.allowed": boolean | null;
};

export type MainAppStateKnownPath = keyof MainAppStateValueByPath;
export type MainAppAutoUpdaterStatus =
    MainAppStateValueByPath["autoUpdater.status"];

interface FitParserSettingsConf {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
}

let fitParserSettingsConf: FitParserSettingsConf | null | undefined;

/**
 * Clears all event handlers registered within the main process state (used by
 * dev helpers/tests).
 */
export function cleanupEventHandlers(): void {
    runtimeMainProcessState.cleanupEventHandlers();
}

/**
 * Returns the current value for a state key from the main process state
 * manager.
 *
 * @param statePath - Dot-notation state path, for example "fitFile.lastResult".
 *
 * @returns Stored state value.
 */
export function getAppState<Path extends MainAppStateKnownPath>(
    statePath: Path
): MainAppStateValueByPath[Path] {
    return runtimeMainProcessState.get(
        statePath
    ) as MainAppStateValueByPath[Path];
}

/**
 * Returns the currently loaded FIT file path tracked by the main process.
 *
 * @returns Loaded FIT file path, or null when no file is active.
 */
export function getLoadedFitFilePath(): MainAppStateValueByPath[
    "loadedFitFilePath"
] {
    return getAppState("loadedFitFilePath");
}

/**
 * Returns the current auto-updater status.
 *
 * @returns Auto-updater lifecycle status.
 */
export function getAutoUpdaterStatus(): MainAppAutoUpdaterStatus {
    return getAppState("autoUpdater.status");
}

/**
 * Returns the BrowserWindow tracked by the main process.
 *
 * @returns Current main window, or null when none has been stored.
 */
export function getMainWindow(): MainAppStateValueByPath["mainWindow"] {
    return getAppState("mainWindow");
}

/**
 * Returns the currently stored Gyazo OAuth callback server.
 *
 * @returns Stored Gyazo server instance, or null when none is active.
 */
export function getGyazoServer(): MainAppStateValueByPath["gyazoServer"] {
    return getAppState("gyazoServer");
}

/**
 * Returns the port used by the active Gyazo OAuth callback server.
 *
 * @returns Stored Gyazo server port, or null when none is active.
 */
export function getGyazoServerPort(): MainAppStateValueByPath[
    "gyazoServerPort"
] {
    return getAppState("gyazoServerPort");
}

/**
 * Returns the cached geolocation permission decision for this app session.
 *
 * @returns Cached allow/deny decision, or null when no decision is cached.
 */
export function getGeolocationPermissionAllowed(): MainAppStateValueByPath[
    "permissions.geolocation.allowed"
] {
    return getAppState("permissions.geolocation.allowed");
}

/**
 * Returns whether the main process is currently quitting.
 *
 * @returns True once the app shutdown lifecycle has started.
 */
export function isAppQuitting(): MainAppStateValueByPath["appIsQuitting"] {
    return getAppState("appIsQuitting");
}

/**
 * Returns whether the auto-updater has been initialized for the current
 * window lifecycle.
 *
 * @returns True once auto-updater setup completed.
 */
export function isAutoUpdaterInitialized(): MainAppStateValueByPath[
    "autoUpdaterInitialized"
] {
    return getAppState("autoUpdaterInitialized");
}

/**
 * Returns whether an update has been downloaded and is ready to install.
 *
 * @returns True when the updater has a downloaded update.
 */
export function isAutoUpdaterUpdateDownloaded(): MainAppStateValueByPath[
    "autoUpdater.updateDownloaded"
] {
    return getAppState("autoUpdater.updateDownloaded");
}

/**
 * Returns whether a Gyazo OAuth callback server is currently tracked.
 *
 * @returns True when a server instance is stored.
 */
export function hasGyazoServer(): boolean {
    return Boolean(getGyazoServer());
}

/**
 * Lazily resolves the configuration store used for fit parser decoder settings.
 * The factory mirrors the previous implementation to keep test hooks
 * unchanged.
 *
 * @returns Electron-conf instance or null when unavailable.
 */
export function resolveFitParserSettingsConf(): FitParserSettingsConf | null {
    if (fitParserSettingsConf !== undefined) {
        return fitParserSettingsConf;
    }

    try {
        fitParserSettingsConf = createElectronConf<FitParserSettingsConf>({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
    } catch {
        fitParserSettingsConf = null;
    }

    return fitParserSettingsConf;
}

/**
 * Persists a value into main process state.
 *
 * @param statePath - Dot-notation path to update.
 * @param value - Value to persist.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setAppState<Path extends MainAppStateKnownPath>(
    statePath: Path,
    value: MainAppStateValueByPath[Path],
    options?: StateUpdateOptions
): void {
    runtimeMainProcessState.set(statePath, value, options);
}

/**
 * Sets or clears the currently loaded FIT file path tracked by the main process.
 *
 * @param filePath - Approved loaded FIT file path, or null when cleared.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setLoadedFitFilePath(
    filePath: MainAppStateValueByPath["loadedFitFilePath"],
    options?: StateUpdateOptions
): void {
    setAppState("loadedFitFilePath", filePath, options);
}

/**
 * Sets or clears the BrowserWindow tracked by the main process.
 *
 * @param mainWindow - Current main window, or null when no window is active.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setMainWindow(
    mainWindow: MainAppStateValueByPath["mainWindow"],
    options?: StateUpdateOptions
): void {
    setAppState("mainWindow", mainWindow, options);
}

/**
 * Sets the main process shutdown flag.
 *
 * @param isQuitting - True when the app shutdown lifecycle has started.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setAppIsQuitting(
    isQuitting: MainAppStateValueByPath["appIsQuitting"],
    options?: StateUpdateOptions
): void {
    setAppState("appIsQuitting", isQuitting, options);
}

/**
 * Sets whether the auto-updater has been initialized for the current window
 * lifecycle.
 *
 * @param isInitialized - True after setup and update checks have started.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setAutoUpdaterInitialized(
    isInitialized: MainAppStateValueByPath["autoUpdaterInitialized"],
    options?: StateUpdateOptions
): void {
    setAppState("autoUpdaterInitialized", isInitialized, options);
}

/**
 * Updates the paired auto-updater status and downloaded flag.
 *
 * @param status - Auto-updater lifecycle status.
 * @param updateDownloaded - True when an update is ready to install.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setAutoUpdaterState(
    status: MainAppAutoUpdaterStatus,
    updateDownloaded: MainAppStateValueByPath["autoUpdater.updateDownloaded"],
    options?: StateUpdateOptions
): void {
    setAppState("autoUpdater.status", status, options);
    setAppState("autoUpdater.updateDownloaded", updateDownloaded, options);
}

/**
 * Sets the active Gyazo OAuth callback server and port together.
 *
 * @param server - Active Gyazo OAuth server instance.
 * @param port - Local callback port used by the server.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setGyazoServerState(
    server: MainAppStateValueByPath["gyazoServer"],
    port: MainAppStateValueByPath["gyazoServerPort"],
    options?: StateUpdateOptions
): void {
    setAppState("gyazoServer", server, options);
    setAppState("gyazoServerPort", port, options);
}

/**
 * Clears the active Gyazo OAuth callback server and port.
 *
 * @param options - Additional metadata forwarded to the state manager.
 */
export function clearGyazoServerState(options?: StateUpdateOptions): void {
    setGyazoServerState(null, null, options);
}

/**
 * Caches the geolocation permission decision for this app session.
 *
 * @param allowed - Allow/deny decision, or null to clear the cached decision.
 * @param options - Additional metadata forwarded to the state manager.
 */
export function setGeolocationPermissionAllowed(
    allowed: MainAppStateValueByPath["permissions.geolocation.allowed"],
    options?: StateUpdateOptions
): void {
    setAppState("permissions.geolocation.allowed", allowed, options);
}

/**
 * Clears the cached geolocation permission decision.
 *
 * @param options - Additional metadata forwarded to the state manager.
 */
export function clearGeolocationPermissionAllowed(
    options?: StateUpdateOptions
): void {
    setGeolocationPermissionAllowed(null, options);
}

export { mainProcessState } from "../../utils/state/integration/mainProcessStateManager.js";

export default {
    cleanupEventHandlers,
    clearGeolocationPermissionAllowed,
    clearGyazoServerState,
    getAutoUpdaterStatus,
    getAppState,
    getGeolocationPermissionAllowed,
    getGyazoServer,
    getGyazoServerPort,
    getLoadedFitFilePath,
    getMainWindow,
    hasGyazoServer,
    isAppQuitting,
    isAutoUpdaterInitialized,
    isAutoUpdaterUpdateDownloaded,
    mainProcessState: runtimeMainProcessState,
    resolveFitParserSettingsConf,
    setAppIsQuitting,
    setAppState,
    setAutoUpdaterInitialized,
    setAutoUpdaterState,
    setGeolocationPermissionAllowed,
    setGyazoServerState,
    setLoadedFitFilePath,
    setMainWindow,
};

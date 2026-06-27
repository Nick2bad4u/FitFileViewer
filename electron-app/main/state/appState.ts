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
    "permissions.geolocation.allowed": boolean;
};

export type MainAppStateKnownPath = keyof MainAppStateValueByPath;

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

export { mainProcessState } from "../../utils/state/integration/mainProcessStateManager.js";

export default {
    cleanupEventHandlers,
    getAppState,
    getLoadedFitFilePath,
    mainProcessState: runtimeMainProcessState,
    resolveFitParserSettingsConf,
    setAppState,
    setLoadedFitFilePath,
};

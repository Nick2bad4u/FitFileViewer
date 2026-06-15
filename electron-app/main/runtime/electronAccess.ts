/**
 * Provides lazily-evaluated references to Electron modules. Tests can inject a
 * pre-resolved Electron module through {@link setElectronOverride}.
 */
import * as electronModule from "electron";

type ElectronLike = Partial<typeof import("electron")> &
    Record<string, unknown>;

function asElectronLike(candidate: unknown): ElectronLike | null {
    if (
        candidate &&
        (typeof candidate === "object" || typeof candidate === "function")
    ) {
        return candidate as ElectronLike;
    }

    return null;
}

let electronOverride: ElectronLike | null = null;

const hasElectronApis = (candidate: unknown): candidate is ElectronLike => {
    const electronLike = asElectronLike(candidate);

    return Boolean(
        electronLike &&
            (electronLike.app ||
                electronLike.BrowserWindow ||
                electronLike.ipcMain ||
                electronLike.Menu ||
                electronLike.shell ||
                electronLike.dialog)
    );
};

/**
 * Lazily resolves the Electron module, handling CJS/ESM interop and honoring
 * test overrides.
 *
 * @returns Electron module reference or an empty object when unavailable.
 */
export function getElectron(): ElectronLike {
    try {
        if (electronOverride) {
            return electronOverride;
        }

        if (hasElectronApis(electronModule)) {
            return electronModule;
        }

        const moduleLike = asElectronLike(electronModule);
        const defaultExport = moduleLike?.["default"];
        if (hasElectronApis(defaultExport)) {
            return defaultExport;
        }

        return moduleLike ?? {};
    } catch {
        return {};
    }
}

/**
 * Returns the currently configured Electron override (used by test priming
 * helpers).
 *
 * @returns Cached override or null when none is set.
 */
export function getElectronOverride(): ElectronLike | null {
    return electronOverride;
}

/**
 * Allows tests to inject a pre-resolved Electron module that will be returned by
 * {@link getElectron}.
 */
export function setElectronOverride(override: unknown): void {
    electronOverride = asElectronLike(override);
}

export const appRef = (): typeof import("electron").app | undefined =>
    getElectron().app;
export const browserWindowRef = ():
    | typeof import("electron").BrowserWindow
    | undefined => getElectron().BrowserWindow;
export const clipboardRef = (): typeof import("electron").clipboard | undefined =>
    getElectron().clipboard;
export const dialogRef = (): typeof import("electron").dialog | undefined =>
    getElectron().dialog;
export const ipcMainRef = (): typeof import("electron").ipcMain | undefined =>
    getElectron().ipcMain;
export const menuRef = (): typeof import("electron").Menu | undefined =>
    getElectron().Menu;
export const nativeImageRef = ():
    | typeof import("electron").nativeImage
    | undefined => getElectron().nativeImage;
export const sessionRef = (): typeof import("electron").session | undefined =>
    getElectron().session;
export const shellRef = (): typeof import("electron").shell | undefined =>
    getElectron().shell;

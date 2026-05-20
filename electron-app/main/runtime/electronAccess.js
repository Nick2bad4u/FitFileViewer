/**
 * Provides lazily-evaluated references to Electron modules. Tests rely on the
 * ability to inject hoisted mocks via {@link globalThis.__electronHoistedMock},
 * so we mirror the defensive implementation that previously lived in main.js.
 */

/**
 * @typedef {Partial<typeof import("electron")> & Record<string, unknown>} ElectronLike
 */

/** @type {ElectronLike | null} */
let electronOverride = getHoistedElectronMock();

/**
 * @param {unknown} candidate
 *
 * @returns {ElectronLike | null}
 */
function asElectronLike(candidate) {
    if (
        candidate &&
        (typeof candidate === "object" || typeof candidate === "function")
    ) {
        return /** @type {ElectronLike} */ (candidate);
    }
    return null;
}

/**
 * @returns {ElectronLike | null}
 */
function getHoistedElectronMock() {
    if (typeof globalThis === "undefined") return null;
    return asElectronLike(Reflect.get(globalThis, "__electronHoistedMock"));
}

/**
 * @param {unknown} candidate
 *
 * @returns {candidate is ElectronLike}
 */
function hasElectronApis(candidate) {
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
}

/**
 * Lazily resolves the Electron module, handling CJS/ESM interop and honoring
 * test overrides.
 *
 * @returns {ElectronLike} Electron module reference or an empty object when unavailable.
 */
function getElectron() {
    try {
        // Vitest can load this module multiple times (CJS require vs ESM import).
        // To keep tests reliable, always honor the hoisted global mock at runtime.

        const hoisted =
            typeof globalThis === "undefined"
                ? null
                : getHoistedElectronMock();
        if (hoisted) return hoisted;

        if (electronOverride) return electronOverride;

        const mod = require("electron");
        if (hasElectronApis(mod)) return mod;
        const moduleLike = asElectronLike(mod);
        const def = moduleLike ? moduleLike.default : undefined;
        if (hasElectronApis(def)) return def;
        return moduleLike || {};
    } catch {
        return {};
    }
}

/**
 * Returns the currently configured Electron override (used by test priming
 * helpers).
 *
 * @returns {ElectronLike | null} Cached override or null when none is set.
 */
function getElectronOverride() {
    return electronOverride;
}

/**
 * Allows tests to inject a pre-resolved Electron module that will be returned
 * by {@link getElectron}.
 *
 * @param {unknown} override - Electron module mock to use for subsequent lookups.
 */
function setElectronOverride(override) {
    electronOverride = asElectronLike(override);
}

/**
 * @returns {typeof import("electron").app | undefined} Electron app reference (may be undefined when Electron is
 *   unavailable).
 */
const appRef = () => getElectron().app;
/**
 * @returns {typeof import("electron").BrowserWindow | undefined} Electron BrowserWindow reference.
 */
const browserWindowRef = () => getElectron().BrowserWindow;
/**
 * @returns {typeof import("electron").dialog | undefined} Electron dialog API reference.
 */
const dialogRef = () => getElectron().dialog;
/**
 * @returns {typeof import("electron").ipcMain | undefined} Electron ipcMain reference.
 */
const ipcMainRef = () => getElectron().ipcMain;
/**
 * @returns {typeof import("electron").Menu | undefined} Electron Menu reference.
 */
const menuRef = () => getElectron().Menu;
/**
 * @returns {typeof import("electron").shell | undefined} Electron shell reference.
 */
const shellRef = () => getElectron().shell;

/**
 * @returns {typeof import("electron").clipboard | undefined} Electron clipboard API reference.
 */
const clipboardRef = () => getElectron().clipboard;

/**
 * @returns {typeof import("electron").nativeImage | undefined} Electron nativeImage API reference.
 */
const nativeImageRef = () => getElectron().nativeImage;

module.exports = {
    appRef,
    browserWindowRef,
    clipboardRef,
    dialogRef,
    getElectron,
    getElectronOverride,
    ipcMainRef,
    menuRef,
    nativeImageRef,
    setElectronOverride,
    shellRef,
};

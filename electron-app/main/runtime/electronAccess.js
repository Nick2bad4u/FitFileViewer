/**
 * Provides lazily-evaluated references to Electron modules. Tests rely on the ability to inject
 * hoisted mocks via {@link globalThis.__electronHoistedMock}, so we mirror the defensive
 * implementation that previously lived in main.js.
 */
let electronOverride =
    (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock) || null;

/**
 * Lazily resolves the Electron module, handling CJS/ESM interop and honoring test overrides.
 *
 * @returns {any} Electron module reference or an empty object when unavailable.
 */
function getElectron() {
    try {
        if (electronOverride) return electronOverride;

        const mod = require("electron");
        const hasApis = (/** @type {any} */ candidate) =>
            candidate &&
            (candidate.app ||
                candidate.BrowserWindow ||
                candidate.ipcMain ||
                candidate.Menu ||
                candidate.shell ||
                candidate.dialog);
        if (hasApis(mod)) return mod;
        const def = /** @type {any} */ (mod).default;
        if (hasApis(def)) return def;
        return mod || /** @type {any} */ ({});
    } catch {
        return /** @type {any} */ ({});
    }
}

/**
 * Returns the currently configured Electron override (used by test priming helpers).
 *
 * @returns {any} Cached override or null when none is set.
 */
function getElectronOverride() {
    return electronOverride;
}

/**
 * Allows tests to inject a pre-resolved Electron module that will be returned by {@link getElectron}.
 *
 * @param {any} override - Electron module mock to use for subsequent lookups.
 */
function setElectronOverride(override) {
    electronOverride = override;
}

/**
 * @returns {any} Electron app reference (may be undefined when Electron is unavailable).
 */
const appRef = () => /** @type {any} */ (getElectron().app);
/**
 * @returns {any} Electron BrowserWindow reference.
 */
const browserWindowRef = () => /** @type {any} */ (getElectron().BrowserWindow);
/**
 * @returns {any} Electron dialog API reference.
 */
const dialogRef = () => /** @type {any} */ (getElectron().dialog);
/**
 * @returns {any} Electron ipcMain reference.
 */
const ipcMainRef = () => /** @type {any} */ (getElectron().ipcMain);
/**
 * @returns {any} Electron Menu reference.
 */
const menuRef = () => /** @type {any} */ (getElectron().Menu);
/**
 * @returns {any} Electron shell reference.
 */
const shellRef = () => /** @type {any} */ (getElectron().shell);

module.exports = {
    appRef,
    browserWindowRef,
    dialogRef,
    getElectron,
    getElectronOverride,
    ipcMainRef,
    menuRef,
    setElectronOverride,
    shellRef,
};

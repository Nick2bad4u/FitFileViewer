"use strict";
/**
 * Provides lazily-evaluated references to Electron modules. Tests rely on the
 * ability to inject hoisted mocks via {@link globalThis.__electronHoistedMock},
 * so we mirror the defensive implementation that previously lived in main.js.
 */
{
    function asElectronLike(candidate) {
        if (
            candidate &&
            (typeof candidate === "object" || typeof candidate === "function")
        ) {
            return candidate;
        }
        return null;
    }
    let electronOverride = getHoistedElectronMock();
    function getHoistedElectronMock() {
        return asElectronLike(Reflect.get(globalThis, "__electronHoistedMock"));
    }
    const hasElectronApis = (candidate) => {
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
     * Lazily resolves the Electron module, handling CJS/ESM interop and
     * honoring test overrides.
     *
     * @returns Electron module reference or an empty object when unavailable.
     */
    function getElectron() {
        try {
            // Vitest can load this module multiple times (CJS require vs ESM import).
            // Always honor the hoisted global mock at runtime to keep tests reliable.
            const hoisted = getHoistedElectronMock();
            if (hoisted) {
                return hoisted;
            }
            if (electronOverride) {
                return electronOverride;
            }
            const mod = require("electron");
            if (hasElectronApis(mod)) {
                return mod;
            }
            const moduleLike = asElectronLike(mod);
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
    function getElectronOverride() {
        return electronOverride;
    }
    /**
     * Allows tests to inject a pre-resolved Electron module that will be
     * returned by {@link getElectron}.
     */
    function setElectronOverride(override) {
        electronOverride = asElectronLike(override);
    }
    const appRef = () => getElectron().app;
    const browserWindowRef = () => getElectron().BrowserWindow;
    const clipboardRef = () => getElectron().clipboard;
    const dialogRef = () => getElectron().dialog;
    const ipcMainRef = () => getElectron().ipcMain;
    const menuRef = () => getElectron().Menu;
    const nativeImageRef = () => getElectron().nativeImage;
    const sessionRef = () => getElectron().session;
    const shellRef = () => getElectron().shell;
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
        sessionRef,
        setElectronOverride,
        shellRef,
    };
}

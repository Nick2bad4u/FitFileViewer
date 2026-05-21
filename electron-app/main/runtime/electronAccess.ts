/**
 * Provides lazily-evaluated references to Electron modules. Tests rely on the
 * ability to inject hoisted mocks via {@link globalThis.__electronHoistedMock},
 * so we mirror the defensive implementation that previously lived in main.js.
 */
{
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

    let electronOverride: ElectronLike | null = getHoistedElectronMock();

    function getHoistedElectronMock(): ElectronLike | null {
        return asElectronLike(Reflect.get(globalThis, "__electronHoistedMock"));
    }

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
     * Lazily resolves the Electron module, handling CJS/ESM interop and
     * honoring test overrides.
     *
     * @returns Electron module reference or an empty object when unavailable.
     */
    function getElectron(): ElectronLike {
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

            const mod = require("electron") as unknown;
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
    function getElectronOverride(): ElectronLike | null {
        return electronOverride;
    }

    /**
     * Allows tests to inject a pre-resolved Electron module that will be
     * returned by {@link getElectron}.
     */
    function setElectronOverride(override: unknown): void {
        electronOverride = asElectronLike(override);
    }

    const appRef = (): typeof import("electron").app | undefined =>
        getElectron().app;
    const browserWindowRef = ():
        | typeof import("electron").BrowserWindow
        | undefined => getElectron().BrowserWindow;
    const clipboardRef = ():
        | typeof import("electron").clipboard
        | undefined => getElectron().clipboard;
    const dialogRef = (): typeof import("electron").dialog | undefined =>
        getElectron().dialog;
    const ipcMainRef = (): typeof import("electron").ipcMain | undefined =>
        getElectron().ipcMain;
    const menuRef = (): typeof import("electron").Menu | undefined =>
        getElectron().Menu;
    const nativeImageRef = ():
        | typeof import("electron").nativeImage
        | undefined => getElectron().nativeImage;
    const shellRef = (): typeof import("electron").shell | undefined =>
        getElectron().shell;

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
}

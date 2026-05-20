/**
 * Provides lazily-evaluated references to Electron modules. Tests rely on the
 * ability to inject hoisted mocks via {@link globalThis.__electronHoistedMock},
 * so we mirror the defensive implementation that previously lived in main.js.
 */
export type ElectronLike = Partial<typeof import("electron")> &
    Record<string, unknown>;
/**
 * @returns {typeof import("electron").app | undefined} Electron app reference (may be undefined when Electron is
 *   unavailable).
 */
export function appRef(): typeof import("electron").app | undefined;
/**
 * @returns {typeof import("electron").BrowserWindow | undefined} Electron BrowserWindow reference.
 */
export function browserWindowRef():
    | typeof import("electron").BrowserWindow
    | undefined;
/**
 * @returns {typeof import("electron").clipboard | undefined} Electron clipboard API reference.
 */
export function clipboardRef(): typeof import("electron").clipboard | undefined;
/**
 * @returns {typeof import("electron").dialog | undefined} Electron dialog API reference.
 */
export function dialogRef(): typeof import("electron").dialog | undefined;
/**
 * Lazily resolves the Electron module, handling CJS/ESM interop and honoring
 * test overrides.
 *
 * @returns {ElectronLike} Electron module reference or an empty object when unavailable.
 */
export function getElectron(): ElectronLike;
/**
 * Returns the currently configured Electron override (used by test priming
 * helpers).
 *
 * @returns {ElectronLike | null} Cached override or null when none is set.
 */
export function getElectronOverride(): ElectronLike | null;
/**
 * @returns {typeof import("electron").ipcMain | undefined} Electron ipcMain reference.
 */
export function ipcMainRef(): typeof import("electron").ipcMain | undefined;
/**
 * @returns {typeof import("electron").Menu | undefined} Electron Menu reference.
 */
export function menuRef(): typeof import("electron").Menu | undefined;
/**
 * @returns {typeof import("electron").nativeImage | undefined} Electron nativeImage API reference.
 */
export function nativeImageRef():
    | typeof import("electron").nativeImage
    | undefined;
/**
 * Allows tests to inject a pre-resolved Electron module that will be returned
 * by {@link getElectron}.
 *
 * @param {unknown} override - Electron module mock to use for subsequent lookups.
 */
export function setElectronOverride(override: unknown): void;
/**
 * @returns {typeof import("electron").shell | undefined} Electron shell reference.
 */
export function shellRef(): typeof import("electron").shell | undefined;

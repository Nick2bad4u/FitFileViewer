/**
 * @returns {any} Electron app reference (may be undefined when Electron is
 *   unavailable).
 */
export function appRef(): any;
/**
 * @returns {any} Electron BrowserWindow reference.
 */
export function browserWindowRef(): any;
/**
 * @returns {any} Electron dialog API reference.
 */
export function dialogRef(): any;
/**
 * Lazily resolves the Electron module, handling CJS/ESM interop and honoring
 * test overrides.
 *
 * @returns {any} Electron module reference or an empty object when unavailable.
 */
export function getElectron(): any;
/**
 * Returns the currently configured Electron override (used by test priming
 * helpers).
 *
 * @returns {any} Cached override or null when none is set.
 */
export function getElectronOverride(): any;
/**
 * @returns {any} Electron ipcMain reference.
 */
export function ipcMainRef(): any;
/**
 * @returns {any} Electron Menu reference.
 */
export function menuRef(): any;
/**
 * Allows tests to inject a pre-resolved Electron module that will be returned
 * by {@link getElectron}.
 *
 * @param {any} override - Electron module mock to use for subsequent lookups.
 */
export function setElectronOverride(override: any): void;
/**
 * @returns {any} Electron shell reference.
 */
export function shellRef(): any;

/**
 * Determines whether the provided BrowserWindow is still usable.
 *
 * @param {any} win - Candidate BrowserWindow instance.
 * @returns {boolean} True when the window and its webContents remain alive.
 */
export function isWindowUsable(win: any): boolean;
/**
 * Validates that a BrowserWindow is usable and logs a structured warning when it is not.
 *
 * @param {any} win - Target BrowserWindow instance.
 * @param {string} [context="unknown operation"] - Description of the operation requiring the window.
 * @returns {boolean} True when the window can be used.
 */
export function validateWindow(win: any, context?: string): boolean;
//# sourceMappingURL=windowValidation.d.ts.map
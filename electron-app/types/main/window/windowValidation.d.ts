export interface WindowUsabilityCandidate {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
    };
}

/**
 * Determines whether the provided BrowserWindow is still usable.
 *
 * @returns {boolean} True when the window and its webContents remain alive.
 */
export function isWindowUsable(
    win?: WindowUsabilityCandidate | null
): boolean;
/**
 * Validates that a BrowserWindow is usable and logs a structured warning when
 * it is not.
 *
 * @param {string} [context="unknown operation"] - Description of the operation
 *   requiring the window. Default is `"unknown operation"`
 *
 * @returns {boolean} True when the window can be used.
 */
export function validateWindow(
    win?: WindowUsabilityCandidate | null,
    context?: string
): boolean;

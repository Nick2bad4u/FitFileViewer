/**
 * Internal function to load a single FIT file as overlay
 * @param {File} file - File to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Load result
 * @private
 */
export function loadSingleOverlayFile(file: File): Promise<{
    success: boolean;
    data?: Object;
    error?: string;
}>;

/**
 * Internal function to load a single FIT file as overlay
 *
 * @private
 *
 * @param {File} file - File to load
 *
 * @returns {Promise<{ success: boolean; data?: Object; error?: string }>} Load
 *   result
 */
export function loadSingleOverlayFile(file: File): Promise<{
    success: boolean;
    data?: Object;
    error?: string;
}>;

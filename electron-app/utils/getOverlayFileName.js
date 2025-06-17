/**
 * Gets the filename for a loaded FIT file overlay by index
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 */

export function getOverlayFileName(idx) {
    if (window.loadedFitFiles && window.loadedFitFiles[idx] && window.loadedFitFiles[idx].filePath) {
        return window.loadedFitFiles[idx].filePath;
    }
    return "";
}

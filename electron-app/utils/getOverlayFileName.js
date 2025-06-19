/**
 * Gets the filename for a loaded FIT file overlay by index
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 */

import { getState } from "./stateManager.js";

/**
 * Gets the filename for a loaded FIT file overlay by index
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 * @throws {TypeError} If idx is not a valid number or loadedFitFiles is not an array
 */
export function getOverlayFileName(idx) {
    const loadedFitFiles = getState("globalData.loadedFitFiles");
    if (!Number.isInteger(idx) || idx < 0) {
        throw new TypeError("Index must be a non-negative integer");
    }
    if (!Array.isArray(loadedFitFiles)) {
        throw new TypeError("Loaded FIT files data is not an array");
    }
    if (loadedFitFiles[idx] && loadedFitFiles[idx].filePath) {
        return loadedFitFiles[idx].filePath;
    }
    return "";
}

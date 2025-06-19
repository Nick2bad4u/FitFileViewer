/**
 * Gets the filename for a loaded FIT file overlay by index
 * Provides safe access to overlay file paths with comprehensive validation
 * 
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 */

import { getState } from "./stateManager.js";

/**
 * Error messages for overlay file operations
 * @readonly
 */
const ERROR_MESSAGES = {
    INVALID_INDEX: "Index must be a non-negative integer",
    INVALID_LOADED_FILES: "Loaded FIT files data is not an array",
    STATE_ACCESS_ERROR: "Failed to access overlay file state:",
};

/**
 * Gets the filename for a loaded FIT file overlay by index
 * 
 * Safely retrieves the file path from the loaded FIT files state with proper validation.
 * Returns an empty string if the index is out of bounds or file data is unavailable.
 *
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 * @throws {TypeError} If idx is not a valid number
 * @example
 * // Get filename for the first overlay file
 * const filename = getOverlayFileName(0);
 * 
 * // Handle case where file doesn't exist
 * const filename = getOverlayFileName(999); // Returns ""
 */
export function getOverlayFileName(idx) {
    // Input validation
    if (!Number.isInteger(idx) || idx < 0) {
        throw new TypeError(ERROR_MESSAGES.INVALID_INDEX);
    }

    try {
        const loadedFitFiles = getState("globalData.loadedFitFiles");
        
        // Validate state data
        if (!Array.isArray(loadedFitFiles)) {
            console.warn(`[getOverlayFileName] ${ERROR_MESSAGES.INVALID_LOADED_FILES}`);
            return "";
        }

        // Check if file exists at index and has a valid file path
        const fileData = loadedFitFiles[idx];
        if (fileData && typeof fileData.filePath === "string" && fileData.filePath.trim()) {
            return fileData.filePath;
        }

        // Return empty string for missing or invalid file data
        return "";
        
    } catch (error) {
        console.error(`[getOverlayFileName] ${ERROR_MESSAGES.STATE_ACCESS_ERROR}`, error);
        return "";
    }
}

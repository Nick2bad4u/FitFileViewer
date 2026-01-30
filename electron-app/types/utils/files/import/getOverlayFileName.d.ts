/**
 * Gets the filename for a loaded FIT file overlay by index
 *
 * Safely retrieves the file path from the loaded FIT files state with proper
 * validation. Returns an empty string if the index is out of bounds or file
 * data is unavailable.
 *
 * @example
 *     // Get filename for the first overlay file
 *     const filename = getOverlayFileName(0);
 *
 *     // Handle case where file doesn't exist
 *     const filename = getOverlayFileName(999); // Returns ""
 *
 * @param {number} idx - Index of the overlay file
 *
 * @returns {string} The filename or empty string if not found
 *
 * @throws {TypeError} If idx is not a valid number
 */
export function getOverlayFileName(idx: number): string;

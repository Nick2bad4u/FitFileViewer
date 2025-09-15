/**
 * @fileoverview Lap number lookup utility for FitFileViewer
 *
 * Provides functions for determining which lap a specific data point index
 * belongs to within FIT file lap message data.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

const LOG_PREFIX = "[LapLookup]";

/**
 * @typedef {Object} LapMessage
 * @property {number} start_index
 * @property {number} end_index
 * @property {number} [total_elapsed_time]
 * @property {number} [total_timer_time]
 * @property {number} [total_distance]
 */

/**
 * Validates lap message structure
 * @param {LapMessage} lap - Lap message object to validate
 * @param {number} lapIndex - Index of the lap for logging
 * @returns {boolean} True if lap has valid structure
 */
function isValidLap(lap, lapIndex) {
    if (!lap || typeof lap !== "object") {
        console.warn(`${LOG_PREFIX} Invalid lap object at index ${lapIndex}:`, lap);
        return false;
    }

    if (typeof lap.start_index !== "number" || typeof lap.end_index !== "number") {
        console.warn(`${LOG_PREFIX} Lap at index ${lapIndex} missing numeric start_index or end_index:`, lap);
        return false;
    }

    if (lap.start_index < 0 || lap.end_index < 0) {
        console.warn(`${LOG_PREFIX} Lap at index ${lapIndex} has negative indices:`, lap);
        return false;
    }

    if (lap.start_index > lap.end_index) {
        console.warn(`${LOG_PREFIX} Lap at index ${lapIndex} has start_index > end_index:`, lap);
        return false;
    }

    return true;
}

/**
 * Validates input parameters
 * @param {number} idx - Point index to validate
 * @param {LapMessage[]} lapMesgs - Lap messages array to validate
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
function validateInputs(idx, lapMesgs) {
    if (typeof idx !== "number" || !Number.isFinite(idx) || idx < 0) {
        return {
            isValid: false,
            error: `Invalid index: must be a non-negative finite number, got ${idx}`,
        };
    }

    if (!Array.isArray(lapMesgs)) {
        return {
            isValid: false,
            error: `Invalid lapMesgs: must be an array, got ${typeof lapMesgs}`,
        };
    }

    if (lapMesgs.length === 0) {
        return {
            isValid: false,
            error: "lapMesgs array is empty",
        };
    }

    return { isValid: true };
}

/**
 * Determines the lap number for a given point index
 *
 * Searches through lap message objects to find which lap contains the
 * specified data point index. Lap numbers are 1-based for user display.
 *
 * @param {number} idx - The index of the point to check (must be non-negative)
 * @param {Array<Object>} lapMesgs - Array of lap message objects with structure:
 *   {
 *     start_index: number, // Starting index of the lap (inclusive)
 *     end_index: number    // Ending index of the lap (inclusive)
 *   }
 * @returns {number|null} The lap number (1-based) if found, or null if not found/invalid input
 *
 * @example
 * const lapMesgs = [
 *   { start_index: 0, end_index: 99 },
 *   { start_index: 100, end_index: 199 }
 * ];
 * getLapNumForIdx(50, lapMesgs);  // Returns 1
 * getLapNumForIdx(150, lapMesgs); // Returns 2
 * getLapNumForIdx(250, lapMesgs); // Returns null
 */
/**
 * @param {number} idx
 * @param {LapMessage[]} lapMesgs
 * @returns {number|null}
 */
export function getLapNumForIdx(idx, lapMesgs) {
    try {
        // Validate inputs
        const validation = validateInputs(idx, lapMesgs);
        if (!validation.isValid) {
            console.warn(`${LOG_PREFIX} ${validation.error}`);
            return null;
        }

        // Search through laps to find matching index
        for (let i = 0; i < lapMesgs.length; i++) {
            const lap = lapMesgs[i];
            if (!lap) {
                continue;
            }

            // Validate lap structure
            if (!isValidLap(lap, i)) {
                continue; // Skip invalid laps
            }

            // Check if index falls within this lap's range
            if (idx >= lap.start_index && idx <= lap.end_index) {
                return i + 1; // Return 1-based lap number
            }
        }

        // Index not found in any lap
        return null;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error determining lap number for index ${idx}:`, error);
        return null;
    }
}

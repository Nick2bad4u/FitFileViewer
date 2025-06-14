// Utility to find lap number for a given point index
/**
 * Determines the lap number for a given point index.
 *
 * @param {number} idx - The index of the point to check.
 * @param {Array<Object>} lapMesgs - An array of lap message objects. Each object should have the following structure:
 *   {
 *     start_index: number, // The starting index of the lap (inclusive).
 *     end_index: number    // The ending index of the lap (inclusive).
 *   }
 *   Example:
 *   [
 *     { start_index: 0, end_index: 99 },
 *     { start_index: 100, end_index: 199 }
 *   ]
 * @returns {number|null} The lap number (1-based) if the index falls within a lap's range, or null if not found.
 */
export function getLapNumForIdx(idx, lapMesgs) {
    for (let i = 0; i < lapMesgs.length; i++) {
        const lap = lapMesgs[i];
        if (lap.start_index !== null && lap.end_index !== null && idx >= lap.start_index && idx <= lap.end_index) {
            return i + 1;
        }
    }
    // Return null if the index does not fall within any lap's start and end indices
    return null;
}

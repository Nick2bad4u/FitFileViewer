/**
 * @typedef {Object} LapMessage
 * @property {number} start_index
 * @property {number} end_index
 * @property {number} [total_elapsed_time]
 * @property {number} [total_timer_time]
 * @property {number} [total_distance]
 */
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
export function getLapNumForIdx(idx: number, lapMesgs: LapMessage[]): number | null;
export type LapMessage = {
    start_index: number;
    end_index: number;
    total_elapsed_time?: number;
    total_timer_time?: number;
    total_distance?: number;
};
//# sourceMappingURL=getLapNumForIdx.d.ts.map
/**
 * Updates the fields of a summary object to ensure they are in a human-readable format.
 * Handles various metrics such as distance, time, speed, power, heart rate, and more.
 *
 * @param {Object} obj - The summary object containing various metrics to be patched
 * @param {Object} [options={}] - Configuration options for patching
 * @param {boolean} [options.preserveOriginal=false] - Whether to preserve original values
 * @param {boolean} [options.skipValidation=false] - Whether to skip input validation
 * @returns {Object} The patched object (same reference as input)
 *
 * @example
 * // Patch summary fields with default options
 * const summary = { total_distance: 5000, avg_speed: 2.5 };
 * patchSummaryFields(summary);
 * // summary.total_distance is now formatted as "5.00 km"
 *
 * @public
 */
/**
 * @param {SummaryRecord} obj
 * @param {PatchSummaryFieldsOptions} [options]
 * @returns {SummaryRecord}
 */
export function patchSummaryFields(obj: SummaryRecord, options?: PatchSummaryFieldsOptions): SummaryRecord;
export type PatchSummaryFieldsOptions = {
    /**
     * Whether to shallow-clone the object before mutating so we can restore on failure
     */
    preserveOriginal?: boolean;
    /**
     * Skip the initial object validation guard
     */
    skipValidation?: boolean;
};
/**
 * Generic summary object we mutate in place. We intentionally allow any value type
 * because raw FIT summary objects are loosely shaped. Using an index signature avoids
 * the numerous TS7053 (implicit any on string index) diagnostics under checkJs.
 */
export type SummaryRecord = Record<string, any>;
//# sourceMappingURL=patchSummaryFields.d.ts.map

/**
 * @typedef {Record<string, any>} TableRow
 */
/**
 * @typedef {Object} DataTable
 * @property {() => TableRow[]} objects - Returns array of row objects
 */
/**
 * Copies the contents of a table as a CSV string to the clipboard
 *
 * This function serializes each row of the table, handling nested objects by stringifying them.
 * It attempts to use the modern Clipboard API and falls back to the legacy method if necessary.
 *
 * @param {DataTable} table - The table object to copy. Must have an `objects()` method that returns an array of row objects
 * @throws {Error} If the table object does not have an `objects()` method
 * @example
 * // Copy a DataTable to clipboard as CSV
 * copyTableAsCSV(myDataTable);
 */
export function copyTableAsCSV(table: DataTable): Promise<void>;
export type TableRow = Record<string, any>;
export type DataTable = {
    /**
     * - Returns array of row objects
     */
    objects: () => TableRow[];
};
//# sourceMappingURL=copyTableAsCSV.d.ts.map
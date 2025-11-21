/**
 * Return the label for a given row index.
 * @param {number} rowIdx
 * @param {boolean} isLap
 * @returns {string}
 */
export function getRowLabel(rowIdx: number, isLap: boolean): string;
/**
 * Build a stable storage key for column visibility preferences for a given file path.
 * Accepts an unused second parameter to remain backwards compatible with older callers
 * passing (data, allKeys).
 * @param {FitSummaryData|GenericRecord|null|undefined} data
 * @param {string[]|undefined} [_allKeys] - Ignored (legacy compatibility)
 * @returns {string}
 */
export function getStorageKey(
    data: FitSummaryData | GenericRecord | null | undefined,
    _allKeys?: string[] | undefined
): string;
/**
 * Load persisted visible column preferences.
 * Accepts unused second parameter allKeys for legacy compatibility (old signature loadColPrefs(key, allKeys)).
 * @param {string} key
 * @param {string[]|undefined} [_allKeys]
 * @returns {string[]|null}
 */
export function loadColPrefs(key: string, _allKeys?: string[] | undefined): string[] | null;
/**
 * Render the summary / laps table into the provided container.
 * @param {{
 *  container: HTMLElement,
 *  data: FitSummaryData,
 *  visibleColumns: string[],
 *  setVisibleColumns: (cols: string[]) => void,
 *  gearBtn: HTMLElement
 * }} params
 * @returns {void}
 */
export function renderTable({
    container,
    data,
    gearBtn,
    setVisibleColumns,
    visibleColumns,
}: {
    container: HTMLElement;
    data: FitSummaryData;
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    gearBtn: HTMLElement;
}): void;
/**
 * Persist visible column preferences.
 * Accepts an unused third parameter (allKeys) for legacy call compatibility.
 * @param {string} key
 * @param {string[]} visibleColumns
 * @param {string[]|undefined} [_allKeys]
 * @returns {void}
 */
export function saveColPrefs(key: string, visibleColumns: string[], _allKeys?: string[] | undefined): void;
/**
 * Show modal dialog to pick visible summary columns.
 * @param {{
 *  allKeys: string[],
 *  visibleColumns: string[],
 *  setVisibleColumns: (cols: string[]) => void,
 *  renderTable: () => void
 * }} params
 * @returns {void}
 */
export function showColModal({
    allKeys,
    renderTable: reRenderTable,
    setVisibleColumns,
    visibleColumns: initialVisibleColumns,
}: {
    allKeys: string[];
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    renderTable: () => void;
}): void;
/**
 * Generic dictionary record
 * @typedef {Record<string, any>} GenericRecord
 */
/**
 * @typedef {Object} FitSummaryData
 * @property {string} [cachedFilePath]
 * @property {GenericRecord[]} [lapMesgs]
 * @property {GenericRecord[]} [sessionMesgs]
 * @property {GenericRecord[]} [recordMesgs]
 */
/**
 * @typedef {Object} SummaryStats
 * @property {number} [total_records]
 * @property {any} [start_time]
 * @property {any} [end_time]
 * @property {number} [duration]
 * @property {number} [total_distance]
 * @property {number} [avg_speed]
 * @property {number} [max_speed]
 * @property {number} [min_altitude_ft]
 * @property {number} [max_altitude_ft]
 * @property {number|string} [total_ascent]
 * @property {number|string} [total_descent]
 * @property {string} [total_ascent_ft]
 * @property {string} [total_descent_ft]
 * @property {any} [startTime]
 */
/**
 * Column selection localStorage key prefix constant
 * @type {string}
 */
/**
 * Augment window types (runtime only, JSDoc helps TS inference)
 * @typedef {Window & { globalData?: any; activeFitFileName?: string; aq?: any }} AugmentedWindow
 */
export const LABEL_COL: "__row_label__";
/**
 * Generic dictionary record
 */
export type GenericRecord = Record<string, any>;
export type FitSummaryData = {
    cachedFilePath?: string;
    lapMesgs?: GenericRecord[];
    sessionMesgs?: GenericRecord[];
    recordMesgs?: GenericRecord[];
};
export type SummaryStats = {
    total_records?: number;
    start_time?: any;
    end_time?: any;
    duration?: number;
    total_distance?: number;
    avg_speed?: number;
    max_speed?: number;
    min_altitude_ft?: number;
    max_altitude_ft?: number;
    total_ascent?: number | string;
    total_descent?: number | string;
    total_ascent_ft?: string;
    total_descent_ft?: string;
    startTime?: any;
};
/**
 * Augment window types (runtime only, JSDoc helps TS inference)
 */
export type AugmentedWindow = Window & {
    globalData?: any;
    activeFitFileName?: string;
    aq?: any;
};
//# sourceMappingURL=renderSummaryHelpers.d.ts.map

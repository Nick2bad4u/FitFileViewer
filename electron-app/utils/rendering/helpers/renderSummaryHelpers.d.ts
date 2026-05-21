/** Generic row shape used by summary and lap table renderers. */
export type SummaryRecord = Record<string, unknown>;

/** Data shape consumed by the legacy summary helper renderer. */
export type FitSummaryData = {
    cachedFilePath?: string;
    lapMesgs?: readonly SummaryRecord[];
    recordMesgs?: readonly SummaryRecord[];
    sessionMesgs?: readonly SummaryRecord[];
};

/** Special synthetic column key used for summary row labels. */
export const LABEL_COL: "__row_label__";

/** Global localStorage key for default summary column preferences. */
export const SUMMARY_COL_GLOBAL_DEFAULT_KEY: string;

/** Returns the global summary-column storage key. */
export function getGlobalStorageKey(): string;

/** Builds the file-specific summary-column storage key. */
export function getStorageKey(
    data: FitSummaryData | SummaryRecord | null | undefined,
    allKeys?: readonly string[]
): string;

/** Loads persisted summary-column preferences. */
export function loadColPrefs(
    key: string,
    allKeys?: readonly string[]
): string[] | null;

/** Orders named columns before numeric-only columns. */
export function orderSummaryColumnsNamedFirst(keys: readonly string[]): string[];

/** Renders the summary table for the selected visible columns. */
export function renderTable(params: {
    container: HTMLElement;
    data: FitSummaryData;
    gearBtn: HTMLElement;
    setVisibleColumns: (cols: string[]) => void;
    visibleColumns: string[];
}): void;

/** Persists summary-column preferences. */
export function saveColPrefs(
    key: string,
    visibleColumns: readonly string[],
    allKeys?: readonly string[]
): void;

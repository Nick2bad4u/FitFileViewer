import type { FitSummaryData } from "./renderSummaryHelpers.js";

/** Opens the summary-column selector modal. */
export function showColModal(params: {
    allKeys: string[];
    data: FitSummaryData;
    renderTable: () => void;
    setVisibleColumns: (cols: string[]) => void;
    visibleColumns: string[];
}): void;

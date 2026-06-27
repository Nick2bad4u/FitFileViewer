/**
 * CSV export constants and configuration
 *
 * @readonly
 */
import type { ElectronClipboardApi } from "../../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    getCopyTableAsCSVRuntime,
    type CopyTableAsCSVRuntime,
} from "./copyTableAsCSVRuntime.js";

const CSV_CONFIG = {
    HEADER_ENABLED: true,
    MESSAGES: {
        CLIPBOARD_ERROR: "Failed to copy CSV:",
        FALLBACK_ERROR: "Failed to copy CSV using fallback:",
        FALLBACK_SUCCESS: "Copied CSV to clipboard using fallback!",
        FALLBACK_WARNING: "Clipboard write fell back to legacy copy.",
        INVALID_TABLE:
            "Invalid table object: expected row array or rows property",
        SUCCESS: "Copied CSV to clipboard!",
    },
    TEXTAREA_STYLES: {
        opacity: "0",
        position: "fixed",
    },
};
function copyTableAsCSVRuntime(): CopyTableAsCSVRuntime {
    return getCopyTableAsCSVRuntime();
}

type TableRow = Record<string, unknown>;

type RowsTable = {
    rows: TableRow[];
};

type ClipboardElectronAPI = {
    readonly writeClipboardText: ElectronClipboardApi["writeClipboardText"];
};

type CopyTableAsCSVOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

/**
 * Copies the contents of a table as a CSV string to the clipboard
 *
 * This function serializes each row of the table, handling nested objects by
 * stringifying them. It attempts to use the modern Clipboard API and falls back
 * to the legacy method if necessary.
 *
 * @example // Copy a DataTable to clipboard as CSV copyTableAsCSV(myDataTable);
 *
 * @throws When the input table cannot be normalized or clipboard copying fails.
 */
export async function copyTableAsCSV(
    table: unknown,
    { electronApiScope }: CopyTableAsCSVOptions = {}
): Promise<void> {
    try {
        const csvString = serializeTableToCSV(table);

        // Attempt clipboard copy
        await copyToClipboard(csvString, electronApiScope);
    } catch (error) {
        console.error("[copyTableAsCSV] Failed to copy table:", error);
        throw error;
    }
}

/**
 * Serializes table-like row data to a CSV string without touching the
 * clipboard.
 *
 * IMPORTANT: Do not use Arquero's `toCSV()` here. Arquero's CSV implementation
 * can rely on runtime function generation in some builds, which violates
 * FitFileViewer's strict CSP (`unsafe-eval` is not allowed).
 *
 * @param table - Table-like rows to serialize.
 *
 * @returns CSV text suitable for clipboard or file export.
 *
 * @throws When the input table cannot be normalized.
 */
export function serializeTableToCSV(table: unknown): string {
    const rows = normalizeTableRows(table);
    const processedRows = processTableRows(rows);

    return buildCsvString(processedRows, {
        includeHeader: CSV_CONFIG.HEADER_ENABLED,
    });
}

/**
 * Build a CSV string from row objects.
 */
function buildCsvString(
    rows: TableRow[],
    { includeHeader }: { includeHeader: boolean }
): string {
    const cols = getCsvColumns(rows);
    const lines: string[] = [];

    if (includeHeader) {
        lines.push(cols.map((value) => escapeCsvValue(value)).join(","));
    }

    for (const row of rows) {
        lines.push(cols.map((k) => escapeCsvValue(row[k])).join(","));
    }

    // Use CRLF for best compatibility with spreadsheet tools.
    return lines.join("\r\n");
}

/**
 * Attempts to copy text to clipboard using modern API with fallback
 *
 * @throws When all clipboard copy strategies fail.
 */
async function copyToClipboard(
    text: string,
    electronApiScope: RendererElectronApiScope | undefined
): Promise<void> {
    // Prefer Electron native clipboard bridge when available (reliable in file:// contexts).
    try {
        const electronAPI = getCopyCsvElectronAPI(electronApiScope);
        if (electronAPI) {
            const { writeClipboardText } = electronAPI;
            const ok = Boolean(await writeClipboardText(text));
            if (ok) {
                console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.SUCCESS}`);
                return;
            }

            // If we have the Electron bridge but it failed, skip the browser clipboard path (commonly denied)
            // and use the legacy fallback directly.
            console.error(
                "[copyTableAsCSV] Electron clipboard bridge failed; using legacy fallback."
            );
            copyToClipboardFallback(text);
            return;
        }
    } catch {
        /* ignore */
    }

    if (await copyTableAsCSVRuntime().copyTextUsingBrowserClipboard(text)) {
        console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.SUCCESS}`);
        return;
    }

    // Fallback to legacy method (mainly for tests / non-Electron contexts).
    // Do not warn here; Electron file:// contexts frequently deny browser clipboard access.
    copyToClipboardFallback(text);
}

/**
 * Legacy clipboard copy using textarea element
 *
 * @throws When the browser refuses the legacy copy command.
 */
function copyToClipboardFallback(text: string): void {
    try {
        copyTableAsCSVRuntime().copyTextUsingLegacyExecCommand(
            text,
            CSV_CONFIG.TEXTAREA_STYLES
        );
        console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_SUCCESS}`);
    } catch (error) {
        console.error(
            `[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_ERROR}`,
            error
        );
        throw error;
    }
}

/**
 * Escape a value for CSV.
 */
function escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    const str = typeof value === "string" ? value : String(value);
    // NOTE: In unicode regex mode, some non-standard escapes are rejected.
    // We only need to match quote/comma/newlines.
    const mustQuote = /[",\r\n]/u.test(str);
    if (!mustQuote) {
        return str;
    }

    // RFC 4180: escape quotes by doubling.
    const escaped = str.replaceAll('"', '""');
    return `"${escaped}"`;
}

function getCsvColumns(rows: TableRow[]): string[] {
    const cols: string[] = [];
    const seen = new Set<string>();

    // Prefer the first row's key order for stability.
    const first = rows.length > 0 ? rows[0] : null;
    if (first && typeof first === "object") {
        for (const k of Object.keys(first)) {
            if (!seen.has(k)) {
                seen.add(k);
                cols.push(k);
            }
        }
    }

    // Add keys encountered later.
    for (const row of rows) {
        for (const k of Object.keys(row)) {
            if (!seen.has(k)) {
                seen.add(k);
                cols.push(k);
            }
        }
    }

    return cols;
}

/**
 * Processes table rows, handling nested objects with caching for performance
 */
function processTableRows(rows: TableRow[]): TableRow[] {
    const cache = new Map<object, string>();

    return rows.map((row) => {
        const processedRow: TableRow = {};

        for (const key of Object.keys(row)) {
            const cell = row[key];

            if (typeof cell === "object" && cell !== null) {
                // Use cache to avoid re-serializing identical objects
                if (cache.has(cell)) {
                    processedRow[key] = cache.get(cell);
                } else {
                    const serialized = JSON.stringify(cell);
                    cache.set(cell, serialized);
                    processedRow[key] = serialized;
                }
            } else {
                processedRow[key] = cell;
            }
        }

        return processedRow;
    });
}

function getCopyCsvElectronAPI(
    scope?: RendererElectronApiScope
): ClipboardElectronAPI | null {
    return getRendererElectronApi<ClipboardElectronAPI>(
        isClipboardElectronAPI,
        scope
    );
}

function isClipboardElectronAPI(value: unknown): value is ClipboardElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return (
        typeof (value as ClipboardElectronAPI).writeClipboardText === "function"
    );
}

function normalizeTableRows(table: unknown): TableRow[] {
    if (isTableRowArray(table)) {
        return table;
    }

    if (isRowsTable(table)) {
        return table.rows;
    }

    console.error(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.INVALID_TABLE}`);
    throw new Error(CSV_CONFIG.MESSAGES.INVALID_TABLE);
}

function isRowsTable(table: unknown): table is RowsTable {
    if (!table || typeof table !== "object") {
        return false;
    }

    const { rows } = table as { rows?: unknown };
    return isTableRowArray(rows);
}

function isTableRow(value: unknown): value is TableRow {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTableRowArray(value: unknown): value is TableRow[] {
    return Array.isArray(value) && value.every((row) => isTableRow(row));
}

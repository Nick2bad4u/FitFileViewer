/**
 * CSV export constants and configuration
 *
 * @readonly
 */
const CSV_CONFIG = {
    HEADER_ENABLED: true,
    MESSAGES: {
        CLIPBOARD_ERROR: "Failed to copy CSV:",
        FALLBACK_ERROR: "Failed to copy CSV using fallback:",
        FALLBACK_SUCCESS: "Copied CSV to clipboard using fallback!",
        FALLBACK_WARNING: "Clipboard write fell back to legacy copy.",
        INVALID_TABLE: "Invalid table object: missing objects method",
        SUCCESS: "Copied CSV to clipboard!",
    },
    TEXTAREA_STYLES: {
        opacity: "0",
        position: "fixed",
    },
};

/**
 * @typedef {Record<string, any>} TableRow
 */

/**
 * @typedef {Object} RowsTable
 *
 * @property {TableRow[]} rows
 */

/**
 * Copies the contents of a table as a CSV string to the clipboard
 *
 * This function serializes each row of the table, handling nested objects by
 * stringifying them. It attempts to use the modern Clipboard API and falls back
 * to the legacy method if necessary.
 *
 * @example
 *     // Copy a DataTable to clipboard as CSV
 *     copyTableAsCSV(myDataTable);
 *
 * @param {TableRow[] | RowsTable | { objects: () => TableRow[] }} table - The
 *   table data to copy. Prefer passing a plain array of row objects
 *   (CSP-safe).
 */
export async function copyTableAsCSV(table) {
    /** @type {TableRow[] | null} */
    let rows = null;

    if (Array.isArray(table)) {
        rows = table;
    } else if (
        table &&
        typeof table === "object" &&
        Array.isArray(/** @type {any} */ (table).rows)
    ) {
        const { rows: tableRows } = /** @type {any} */ (table);
        rows = tableRows;
    } else if (
        table &&
        typeof table === "object" &&
        typeof (/** @type {any} */ (table).objects) === "function"
    ) {
        // Back-compat ONLY. Note: Arquero's objects() can violate CSP (unsafe-eval).
        try {
            const { objects } = /** @type {any} */ (table);
            rows = objects();
        } catch (error) {
            console.error("[copyTableAsCSV] Failed to copy table:", error);
            throw error;
        }
    }

    if (!rows) {
        console.error(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.INVALID_TABLE}`);
        throw new Error(CSV_CONFIG.MESSAGES.INVALID_TABLE);
    }

    try {
        // Serialize table data with object handling.
        // IMPORTANT: Do not use Arquero's `toCSV()` here.
        // Arquero's CSV implementation can rely on runtime function generation in some builds,
        // which violates FitFileViewer's strict CSP (no `unsafe-eval`).
        const processedRows = processTableRows(rows);

        // Convert to CSV format (CSP-safe).
        const csvString = buildCsvString(processedRows, {
            includeHeader: CSV_CONFIG.HEADER_ENABLED,
        });

        // Attempt clipboard copy
        await copyToClipboard(csvString);
    } catch (error) {
        console.error("[copyTableAsCSV] Failed to copy table:", error);
        throw error;
    }
}

/**
 * Build a CSV string from row objects.
 *
 * @param {TableRow[]} rows
 * @param {{ includeHeader: boolean }} options
 *
 * @returns {string}
 */
function buildCsvString(rows, { includeHeader }) {
    const cols = getCsvColumns(rows);
    /** @type {string[]} */
    const lines = [];

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
 * @private
 *
 * @param {string} text - Text to copy to clipboard
 *
 * @returns {Promise<void>} Resolves when copy operation completes
 */
async function copyToClipboard(text) {
    // Prefer Electron native clipboard bridge when available (reliable in file:// contexts).
    try {
        const { electronAPI } = /** @type {any} */ (globalThis);
        if (
            electronAPI &&
            typeof electronAPI.writeClipboardText === "function"
        ) {
            const { writeClipboardText } = electronAPI;
            const ok = Boolean(await writeClipboardText(text));
            if (ok) {
                console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.SUCCESS}`);
                return;
            }

            // If we have the Electron bridge but it failed, skip navigator.clipboard (commonly denied)
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

    // Try modern Clipboard API.
    const { clipboard } = navigator;
    if (clipboard && typeof clipboard.writeText === "function") {
        try {
            await clipboard.writeText(text);
            console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.SUCCESS}`);
            return;
        } catch {
            // Do not treat as a hard error; permissions are commonly denied in non-secure contexts.
        }
    }

    // Fallback to legacy method (mainly for tests / non-Electron contexts).
    // Do not warn here; Electron file:// contexts frequently deny navigator.clipboard.
    copyToClipboardFallback(text);
}

/**
 * Legacy clipboard copy using textarea element
 *
 * @private
 *
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboardFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Apply styles to prevent visual disruption
    Object.assign(textarea.style, CSV_CONFIG.TEXTAREA_STYLES);

    document.body.append(textarea);
    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand("copy");
        if (successful) {
            console.log(
                `[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_SUCCESS}`
            );
        } else {
            throw new Error("execCommand('copy') returned false");
        }
    } catch (error) {
        console.error(
            `[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_ERROR}`,
            error
        );
        throw error;
    } finally {
        textarea.remove();
    }
}

/**
 * Escape a value for CSV.
 *
 * @param {unknown} value
 *
 * @returns {string}
 */
function escapeCsvValue(value) {
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

/**
 * @param {TableRow[]} rows
 *
 * @returns {string[]}
 */
function getCsvColumns(rows) {
    /** @type {string[]} */
    const cols = [];
    /** @type {Set<string>} */
    const seen = new Set();

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

    // Add any keys encountered later.
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
 *
 * @private
 *
 * @param {TableRow[]} rows - Array of row objects from the table
 *
 * @returns {TableRow[]} Processed rows with serialized objects
 */
function processTableRows(rows) {
    const cache = new Map();

    return rows.map((row) => {
        const processedRow = /** @type {TableRow} */ ({});

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

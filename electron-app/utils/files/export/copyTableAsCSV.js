/**
 * CSV export constants and configuration
 * @readonly
 */
const CSV_CONFIG = {
    HEADER_ENABLED: true,
    MESSAGES: {
        CLIPBOARD_ERROR: "Failed to copy CSV:",
        FALLBACK_ERROR: "Failed to copy CSV using fallback:",
        FALLBACK_SUCCESS: "Copied CSV to clipboard using fallback!",
        FALLBACK_WARNING: "navigator.clipboard.writeText is not supported. Using fallback.",
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
export async function copyTableAsCSV(table) {
    // Input validation
    if (!table || typeof table.objects !== "function") {
        console.error(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.INVALID_TABLE}`);
        throw new Error(CSV_CONFIG.MESSAGES.INVALID_TABLE);
    }

    try {
        // Serialize table data with object handling
        const // Convert to CSV format
            { aq } = /** @type {any} */ (globalThis),
            // Avoid repeated property lookups and satisfy prefer-destructuring
            processedRows = processTableRows(table.objects()),
            flattenedTable = aq.from(processedRows),
            csvString = flattenedTable.toCSV({ header: CSV_CONFIG.HEADER_ENABLED });

        // Attempt clipboard copy
        await copyToClipboard(csvString);
    } catch (error) {
        console.error("[copyTableAsCSV] Failed to copy table:", error);
        throw error;
    }
}

/**
 * Attempts to copy text to clipboard using modern API with fallback
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<void>} Resolves when copy operation completes
 * @private
 */
async function copyToClipboard(text) {
    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
            await navigator.clipboard.writeText(text);
            console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.SUCCESS}`);
            return;
        } catch (error) {
            console.error(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.CLIPBOARD_ERROR}`, error);
            // Fall through to legacy method
        }
    }

    // Fallback to legacy method
    console.warn(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_WARNING}`);
    copyToClipboardFallback(text);
}

/**
 * Legacy clipboard copy using textarea element
 * @param {string} text - Text to copy to clipboard
 * @private
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
            console.log(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_SUCCESS}`);
        } else {
            throw new Error("execCommand('copy') returned false");
        }
    } catch (error) {
        console.error(`[copyTableAsCSV] ${CSV_CONFIG.MESSAGES.FALLBACK_ERROR}`, error);
        throw error;
    } finally {
        textarea.remove();
    }
}

/**
 * Processes table rows, handling nested objects with caching for performance
 * @param {TableRow[]} rows - Array of row objects from the table
 * @returns {TableRow[]} Processed rows with serialized objects
 * @private
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

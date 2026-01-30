import { renderTable } from "../core/renderTable.js";

/**
 * Renders all data tables from the provided dataFrames object into the
 * specified container.
 *
 * - Uses Arquero (window.aq) to convert arrays to tables.
 * - Renders each table using renderTable().
 * - 'recordMesgs' is always rendered first, then other tables alphabetically.
 *
 * @param {Object} dataFrames - An object where each key is a table name and the
 *   value is an array of row objects.
 * @param {HTMLElement} [containerOverride] - Optional container element to
 *   render tables into. Defaults to element with id 'content_data'.
 *
 *   Note: The `renderTable` function receives an additional `index` parameter,
 *   which represents the order of the table being rendered.
 */
export function createTables(dataFrames, containerOverride) {
    const container =
        containerOverride || document.querySelector("#content_data");
    if (!container) {
        console.error(
            '[ERROR] Container element with id "content_data" not found. Please ensure the element exists in the DOM or provide a valid containerOverride.'
        );
        return;
    }

    while (container.firstChild) {
        container.firstChild.remove();
    }
    /**
     * @param {unknown} row
     *
     * @returns {row is Record<string, unknown>}
     */
    const isRowObject = (row) =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row);

    const keys = Object.keys(dataFrames).filter((key) => {
        const rows = /** @type {unknown} */ (
            /** @type {any} */ (dataFrames)[key]
        );
        // Some datasets can contain occasional null entries; render what we can instead of dropping the entire table.
        return Array.isArray(rows) && rows.some((row) => isRowObject(row));
    });

    /**
     * Treat message tables with numeric-only keys (e.g. "140", "141") as
     * low-priority / misc device data. Keep them at the bottom of the Raw Data
     * tab.
     *
     * This mirrors the Summary tab behavior where numbered-only columns are
     * placed last.
     *
     * @param {string} key
     */
    const isNumericOnlyKey = (key) => /^\d+$/u.test(key);

    // Sort keys so 'recordMesgs' appears first, then named tables, then numeric-only tables.
    keys.sort((a, b) => {
        if (a === "recordMesgs") return -1;
        if (b === "recordMesgs") return 1;

        const aNumeric = isNumericOnlyKey(a);
        const bNumeric = isNumericOnlyKey(b);
        if (aNumeric !== bNumeric) {
            return aNumeric ? 1 : -1;
        }

        // Within the numeric-only group, order numerically for readability.
        if (aNumeric && bNumeric) {
            return Number(a) - Number(b);
        }

        return a.localeCompare(b);
    });

    for (const [index, key] of keys.entries()) {
        try {
            const rows = /** @type {unknown[]} */ (
                /** @type {any} */ (dataFrames)[key]
            );
            if (!Array.isArray(rows) || rows.length === 0) {
                continue;
            }

            const validRows = rows.filter((row) => isRowObject(row));
            if (validRows.length === 0) {
                console.warn(
                    `[WARNING] Skipping table for key: ${key} as it has no compatible rows.`
                );
                continue;
            }

            // IMPORTANT (CSP): Avoid Arquero for raw table rendering.
            // Arquero's `toHTML()` / `objects()` use runtime Function generation in some builds,
            // which is blocked by our CSP (no unsafe-eval). Render tables directly from raw rows instead.
            renderTable(container, key, { rows: validRows }, index);
        } catch (error) {
            console.error(
                `[ERROR] Failed to render table for key: ${key}. Error message: ${/** @type {any} */ (error).message}. Stack trace:`,
                /** @type {any} */ (error).stack
            );
        }
    }
}

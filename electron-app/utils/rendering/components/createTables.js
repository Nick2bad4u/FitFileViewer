import { renderTable } from "../core/renderTable.js";

/**
 * Renders all data tables from the provided dataFrames object into the specified container.
 *
 * - Uses Arquero (window.aq) to convert arrays to tables.
 * - Renders each table using renderTable().
 * - 'recordMesgs' is always rendered first, then other tables alphabetically.
 *
 * @param {Object} dataFrames - An object where each key is a table name and the value is an array of row objects.
 * @param {HTMLElement} [containerOverride] - Optional container element to render tables into. Defaults to element with id 'content-data'.
 *
 * Note: The `renderTable` function receives an additional `index` parameter, which represents the order of the table being rendered.
 */
export function createTables(dataFrames, containerOverride) {
    console.log("[DEBUG] createTables called", dataFrames);

    const container = containerOverride || document.querySelector("#content-data");
    if (!container) {
        console.error(
            '[ERROR] Container element with id "content-data" not found. Please ensure the element exists in the DOM or provide a valid containerOverride.'
        );
        return;
    }
    if (!container) {
        console.error('[ERROR] Container element with id "content-data" not found.');
        return;
    }

    while (container.firstChild) {
        container.firstChild.remove();
    }
    /**
     * @param {unknown} row
     * @returns {row is Record<string, unknown>}
     */
    const isRowObject = (row) => Boolean(row) && typeof row === "object" && !Array.isArray(row);

    const keys = Object.keys(dataFrames).filter((key) => {
        const rows = /** @type {unknown} */ (/** @type {any} */ (dataFrames)[key]);
        // Some datasets can contain occasional null entries; render what we can instead of dropping the entire table.
        return Array.isArray(rows) && rows.some((row) => isRowObject(row));
    });
    console.log("[DEBUG] Table keys:", keys);

    // Debug: print first *valid* row of each table
    for (const key of keys) {
        const rows = /** @type {unknown[]} */ (/** @type {any} */ (dataFrames)[key]);
        const firstValid = Array.isArray(rows) ? rows.find((row) => isRowObject(row)) : null;
        if (firstValid) {
            console.log(`[DEBUG] First row for ${key}:`, firstValid, "Type:", typeof firstValid);
        }
    }

    // Sort keys so 'recordMesgs' appears first, then alphabetically
    keys.sort((a, b) => {
        if (a === "recordMesgs") {
            return -1;
        }
        if (b === "recordMesgs") {
            return 1;
        }
        return a.localeCompare(b);
    });

    for (const [index, key] of keys.entries()) {
        try {
            const rows = /** @type {unknown[]} */ (/** @type {any} */ (dataFrames)[key]);
            if (!Array.isArray(rows) || rows.length === 0) {
                continue;
            }

            const validRows = rows.filter((row) => isRowObject(row));
            if (validRows.length === 0) {
                console.warn(`[WARNING] Skipping table for key: ${key} as it has no compatible rows.`);
                continue;
            }

            // IMPORTANT (CSP): Avoid Arquero for raw table rendering.
            // Arquero's `toHTML()` / `objects()` use runtime Function generation in some builds,
            // which is blocked by our CSP (no unsafe-eval). Render tables directly from raw rows instead.
            console.log(`[DEBUG] Rendering table for key: ${key}, rows:`, validRows.length);
            renderTable(container, key, { rows: validRows }, index);
        } catch (error) {
            console.error(
                `[ERROR] Failed to render table for key: ${key}. Error message: ${/** @type {any} */ (error).message}. Stack trace:`,
                /** @type {any} */ (error).stack
            );
        }
    }
}

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

    const { aq } = /** @type {any} */ (globalThis);
    if (!aq) {
        console.error("[ERROR] Arquero (window.aq) is not available.");
        return;
    }

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
    const keys = Object.keys(dataFrames).filter((key) => {
        const rows = /** @type {any} */ (dataFrames)[key];
        return Array.isArray(rows) && rows.every((row) => row && typeof row === "object" && !Array.isArray(row));
    });
    console.log("[DEBUG] Table keys:", keys);

    // Debug: print first row of each table
    for (const key of keys) {
        const rows = /** @type {any} */ (dataFrames)[key];
        if (rows && rows.length > 0) {
            console.log(`[DEBUG] First row for ${key}:`, rows[0], "Type:", typeof rows[0]);
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
            const rows = /** @type {any} */ (dataFrames)[key];
            if (
                !Array.isArray(rows) ||
                rows.length === 0 ||
                !rows.every((row) => row && typeof row === "object" && !Array.isArray(row))
            ) {
                console.warn(`[WARNING] Skipping table for key: ${key} as it is not compatible with Arquero.`);
                continue;
            }
            const table = aq.from(rows);
            console.log(`[DEBUG] Rendering table for key: ${key}, rows:`, table.numRows());
            renderTable(container, key, table, index);
        } catch (error) {
            console.error(
                `[ERROR] Failed to render table for key: ${key}. Error message: ${/** @type {any} */ (error).message}. Stack trace:`,
                /** @type {any} */ (error).stack
            );
        }
    }
}

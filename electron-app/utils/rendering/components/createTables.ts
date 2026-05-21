import { renderTable } from "../core/renderTable.js";

type TableRow = Record<string, unknown>;
type DataFrames = Record<string, unknown>;

function isTableRow(row: unknown): row is TableRow {
    return Boolean(row) && typeof row === "object" && !Array.isArray(row);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
}

function isNumericOnlyKey(key: string): boolean {
    return /^\d+$/u.test(key);
}

/**
 * Renders all compatible data tables into the raw data container.
 *
 * `recordMesgs` is always rendered first, then named tables, then numeric-only
 * miscellaneous tables.
 *
 * @param dataFrames - Object keyed by table name, with array-like row values.
 * @param containerOverride - Optional container element to render into.
 */
export function createTables(
    dataFrames: DataFrames,
    containerOverride?: HTMLElement
): void {
    const container =
        containerOverride ??
        document.querySelector<HTMLElement>("#content_data");
    if (!container) {
        console.error(
            '[ERROR] Container element with id "content_data" not found. Please ensure the element exists in the DOM or provide a valid containerOverride.'
        );
        return;
    }

    while (container.firstChild) {
        container.firstChild.remove();
    }

    const keys = Object.keys(dataFrames).filter((key) => {
        const rows = dataFrames[key];
        // Some datasets can contain occasional null entries; render what we can instead of dropping the entire table.
        return Array.isArray(rows) && rows.some((row) => isTableRow(row));
    });

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
            const rows = dataFrames[key];
            if (!Array.isArray(rows) || rows.length === 0) {
                continue;
            }

            const validRows = rows.filter((row) => isTableRow(row));
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
                `[ERROR] Failed to render table for key: ${key}. Error message: ${getErrorMessage(error)}. Stack trace:`,
                getErrorStack(error)
            );
        }
    }
}

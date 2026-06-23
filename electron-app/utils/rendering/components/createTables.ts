import { renderTable } from "../core/renderTable.js";
import { getCreateTablesRuntime } from "./createTablesRuntime.js";
import {
    getFitTableEntries,
    isFitTableEntry,
    type FitTableEntry,
} from "../../state/domain/fitTableDataState.js";

const createTablesRuntime = getCreateTablesRuntime();

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
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
    dataFrames: unknown,
    containerOverride?: HTMLElement
): void {
    const container =
        containerOverride ?? createTablesRuntime.getDefaultContainer();
    if (!container) {
        console.error(
            '[ERROR] Container element with id "content_data" not found. Please ensure the element exists in the DOM or provide a valid containerOverride.'
        );
        return;
    }

    while (container.firstChild) {
        container.firstChild.remove();
    }

    for (const [index, { key, rows }] of resolveTableEntries(
        dataFrames
    ).entries()) {
        try {
            // IMPORTANT (CSP): Avoid Arquero for raw table rendering.
            // Arquero's `toHTML()` / `objects()` use runtime Function generation in some builds,
            // which is blocked by our CSP (no unsafe-eval). Render tables directly from raw rows instead.
            renderTable(container, key, { rows }, index);
        } catch (error) {
            console.error(
                `[ERROR] Failed to render table for key: ${key}. Error message: ${getErrorMessage(error)}. Stack trace:`,
                getErrorStack(error)
            );
        }
    }
}

function resolveTableEntries(dataFrames: unknown): FitTableEntry[] {
    return Array.isArray(dataFrames) && dataFrames.every(isFitTableEntry)
        ? dataFrames
        : getFitTableEntries(dataFrames);
}

import { getActiveFitRawData } from "./activeFitRawDataState.js";

export type FitTableRow = Record<string, unknown>;

export type FitTableEntry = {
    key: string;
    rows: FitTableRow[];
};

export type FitTableDataSource = Record<string, unknown>;

export type ActiveFitTableData = {
    rawData: FitTableDataSource | null;
    ready: boolean;
    tableCount: number;
    tables: FitTableEntry[];
    totalRows: number;
};

export function getActiveFitTableData(
    sourceData?: unknown
): ActiveFitTableData {
    const activeSourceData =
        sourceData === undefined ? getActiveFitRawData() : sourceData;
    const rawData = isFitTableDataSource(activeSourceData)
        ? activeSourceData
        : null;
    const tables = rawData ? getFitTableEntries(rawData) : [];

    return {
        rawData,
        ready: tables.length > 0,
        tableCount: tables.length,
        tables,
        totalRows: tables.reduce((sum, table) => sum + table.rows.length, 0),
    };
}

export function hasActiveFitTableData(): boolean {
    return getActiveFitTableData().ready;
}

export function getFitTableEntries(sourceData: unknown): FitTableEntry[] {
    if (!isFitTableDataSource(sourceData)) {
        return [];
    }

    return getSortedTableKeys(sourceData)
        .map((key) => ({
            key,
            rows: getFitTableRows(sourceData[key]),
        }))
        .filter((table) => table.rows.length > 0);
}

export function getFitTableRows(value: unknown): FitTableRow[] {
    return Array.isArray(value) ? value.filter(isFitTableRow) : [];
}

export function isFitTableDataSource(
    value: unknown
): value is FitTableDataSource {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isFitTableEntry(value: unknown): value is FitTableEntry {
    return (
        isFitTableDataSource(value) &&
        typeof value["key"] === "string" &&
        Array.isArray(value["rows"]) &&
        value["rows"].every(isFitTableRow)
    );
}

export function isFitTableRow(value: unknown): value is FitTableRow {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getSortedTableKeys(sourceData: FitTableDataSource): string[] {
    const keys = Object.keys(sourceData).filter(
        (key) => getFitTableRows(sourceData[key]).length > 0
    );

    keys.sort(compareTableKeys);
    return keys;
}

function compareTableKeys(a: string, b: string): number {
    if (a === "recordMesgs") return -1;
    if (b === "recordMesgs") return 1;

    const aNumeric = isNumericOnlyKey(a);
    const bNumeric = isNumericOnlyKey(b);
    if (aNumeric !== bNumeric) {
        return aNumeric ? 1 : -1;
    }

    if (aNumeric && bNumeric) {
        return Number(a) - Number(b);
    }

    return a.localeCompare(b);
}

function isNumericOnlyKey(key: string): boolean {
    return /^\d+$/u.test(key);
}

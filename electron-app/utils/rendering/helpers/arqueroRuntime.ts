import type { SummaryRecord } from "./renderSummaryHelpers.js";

export type ArqueroTable = {
    array: (columnName: string) => unknown[];
    columnNames: () => string[];
    get: (rowIndex: number, columnName: string) => unknown;
    numRows: () => number;
};

export type ArqueroRuntime = {
    from: (records: readonly SummaryRecord[]) => ArqueroTable;
};

interface ArqueroRuntimeRegistry {
    runtime?: unknown;
}

const arqueroRuntimeRegistryKey = Symbol.for("fitfileviewer.arqueroRuntime");

export function setArqueroRuntime(runtime: unknown): void {
    getArqueroRuntimeRegistry().runtime = runtime;
}

export function clearArqueroRuntimeForTests(): void {
    getArqueroRuntimeRegistry().runtime = undefined;
}

export function resolveArqueroRuntime(): ArqueroRuntime | undefined {
    const runtime = getArqueroRuntimeRegistry().runtime;
    return isArqueroRuntime(runtime) ? runtime : undefined;
}

export function isArqueroRuntime(value: unknown): value is ArqueroRuntime {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { from?: unknown }).from === "function"
    );
}

function getArqueroRuntimeRegistry(): ArqueroRuntimeRegistry {
    const arqueroGlobal = globalThis as typeof globalThis &
        Record<symbol, ArqueroRuntimeRegistry | undefined>;
    arqueroGlobal[arqueroRuntimeRegistryKey] ??= {};
    return arqueroGlobal[arqueroRuntimeRegistryKey];
}

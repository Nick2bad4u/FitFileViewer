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

type ArqueroRuntimeRegistry = {
    runtime?: unknown;
};

const arqueroRuntimeRegistry: ArqueroRuntimeRegistry = {};

export function setArqueroRuntime(runtime: unknown): void {
    arqueroRuntimeRegistry.runtime = runtime;
}

export function clearArqueroRuntimeForTests(): void {
    arqueroRuntimeRegistry.runtime = undefined;
}

export function resolveArqueroRuntime(): ArqueroRuntime | undefined {
    const runtime = arqueroRuntimeRegistry.runtime;
    return isArqueroRuntime(runtime) ? runtime : undefined;
}

export function isArqueroRuntime(value: unknown): value is ArqueroRuntime {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { from?: unknown }).from === "function"
    );
}

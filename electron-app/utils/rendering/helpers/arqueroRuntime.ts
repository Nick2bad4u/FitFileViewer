import type { SummaryRecord } from "./renderSummaryHelpers.js";

export type ArqueroColumnArray =
    | readonly unknown[]
    | BigInt64Array
    | BigUint64Array
    | Float32Array
    | Float64Array
    | Int16Array
    | Int32Array
    | Int8Array
    | Uint16Array
    | Uint32Array
    | Uint8Array
    | Uint8ClampedArray;

export type ArqueroTable = {
    array: (columnName: string) => ArqueroColumnArray;
    columnNames: () => string[];
    get: (columnName: string, rowIndex?: number) => unknown;
    numRows: () => number;
};

export type ArqueroRuntime = {
    from: (records: readonly SummaryRecord[]) => ArqueroTable;
};

type ArqueroRuntimeRegistry = {
    runtime?: unknown;
};

const arqueroRuntimeRegistry: ArqueroRuntimeRegistry = {};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
        isRecord(value) && typeof value["from"] === "function"
    );
}

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

type ArqueroRuntimeCandidate = Readonly<{
    readonly from?: unknown;
}>;

type ArqueroRuntimeRegistry = {
    runtime?: ArqueroRuntime;
};

const arqueroRuntimeRegistry: ArqueroRuntimeRegistry = {};

function isObjectCandidate(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArqueroRuntimeCandidate(
    value: unknown
): ArqueroRuntimeCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function readRuntimeValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
}

export function registerArqueroRuntime(runtime: ArqueroRuntime): void {
    arqueroRuntimeRegistry.runtime = runtime;
}

export function clearArqueroRuntimeForTests(): void {
    delete arqueroRuntimeRegistry.runtime;
}

export function resolveArqueroRuntime(): ArqueroRuntime | undefined {
    return arqueroRuntimeRegistry.runtime;
}

export function isArqueroRuntime(value: unknown): value is ArqueroRuntime {
    const runtime = toArqueroRuntimeCandidate(value);
    return (
        runtime !== undefined &&
        typeof readRuntimeValue(() => runtime.from) === "function"
    );
}

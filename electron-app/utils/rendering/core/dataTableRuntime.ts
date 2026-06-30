type DataTableRuntimeRegistry = {
    runtime?: RegisteredDataTableRuntime;
};

export type RegisteredDataTableRuntime = ((...args: never[]) => unknown) &
    Readonly<{
        isDataTable: (selector: string) => boolean;
    }>;

type DataTableRuntimeCandidate = ((...args: unknown[]) => unknown) &
    Readonly<{
        isDataTable?: unknown;
    }>;

const dataTableRuntimeRegistry: DataTableRuntimeRegistry = {};

export function setDataTableRuntime(runtime: RegisteredDataTableRuntime): void {
    dataTableRuntimeRegistry.runtime = runtime;
}

export function clearDataTableRuntimeForTests(): void {
    delete dataTableRuntimeRegistry.runtime;
}

export function isRegisteredDataTableRuntime(
    value: unknown
): value is RegisteredDataTableRuntime {
    if (!isDataTableRuntimeCandidate(value)) {
        return false;
    }

    return typeof value.isDataTable === "function";
}

export function resolveDataTableRuntime<T>(
    isRuntime: (value: unknown) => value is T
): T | null {
    for (const candidate of getDataTableRuntimeCandidates()) {
        if (isRuntime(candidate)) {
            return candidate;
        }
    }

    return null;
}

function getDataTableRuntimeCandidates(): unknown[] {
    return dataTableRuntimeRegistry.runtime === undefined
        ? []
        : [dataTableRuntimeRegistry.runtime];
}

function isDataTableRuntimeCandidate(
    value: unknown
): value is DataTableRuntimeCandidate {
    return typeof value === "function";
}

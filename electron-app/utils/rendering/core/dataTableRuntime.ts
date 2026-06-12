type DataTableRuntimeRegistry = {
    runtime?: unknown;
};

const dataTableRuntimeRegistry: DataTableRuntimeRegistry = {};

export function setDataTableRuntime(runtime: unknown): void {
    dataTableRuntimeRegistry.runtime = runtime;
}

export function clearDataTableRuntimeForTests(): void {
    dataTableRuntimeRegistry.runtime = undefined;
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
    return [dataTableRuntimeRegistry.runtime];
}

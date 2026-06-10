interface DataTableRuntimeRegistry {
    runtime?: unknown;
}

const dataTableRuntimeRegistryKey = Symbol.for(
    "fitfileviewer.dataTableRuntime"
);

export function setDataTableRuntime(runtime: unknown): void {
    getDataTableRuntimeRegistry().runtime = runtime;
}

export function clearDataTableRuntimeForTests(): void {
    getDataTableRuntimeRegistry().runtime = undefined;
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
    const registry = getDataTableRuntimeRegistry();
    return [registry.runtime];
}

function getDataTableRuntimeRegistry(): DataTableRuntimeRegistry {
    const dataTableGlobal = globalThis as typeof globalThis &
        Record<symbol, DataTableRuntimeRegistry | undefined>;
    dataTableGlobal[dataTableRuntimeRegistryKey] ??= {};
    return dataTableGlobal[dataTableRuntimeRegistryKey];
}

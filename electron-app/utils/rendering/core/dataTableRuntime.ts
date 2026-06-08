interface DataTableRuntimeRegistry {
    runtime?: unknown;
}

const dataTableRuntimeRegistryKey = Symbol.for(
    "fitfileviewer.dataTableRuntime"
);
const runtimeGlobalFallbackFlag =
    "__fitFileViewerRuntimeGlobalFallbackForTests";

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
    return isRuntimeGlobalFallbackEnabled()
        ? [
              registry.runtime,
              getGlobalRuntimeCandidate("DataTable"),
              getWindowRuntimeCandidate("DataTable"),
          ]
        : [registry.runtime];
}

function getDataTableRuntimeRegistry(): DataTableRuntimeRegistry {
    const dataTableGlobal = globalThis as typeof globalThis &
        Record<symbol, DataTableRuntimeRegistry | undefined>;
    dataTableGlobal[dataTableRuntimeRegistryKey] ??= {};
    return dataTableGlobal[dataTableRuntimeRegistryKey];
}

function isRuntimeGlobalFallbackEnabled(): boolean {
    return Reflect.get(globalThis, runtimeGlobalFallbackFlag) === true;
}

function getGlobalRuntimeCandidate(name: string): unknown {
    return Reflect.get(globalThis, name);
}

function getWindowRuntimeCandidate(name: string): unknown {
    const windowRef = Reflect.get(globalThis, "window");
    return windowRef && typeof windowRef === "object"
        ? Reflect.get(windowRef, name)
        : undefined;
}

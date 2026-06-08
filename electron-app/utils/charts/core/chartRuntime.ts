interface ChartRuntimeRegistry {
    runtime?: unknown;
    zoomPlugin?: unknown;
}

const chartRuntimeRegistryKey = Symbol.for("fitfileviewer.chartRuntime");
const runtimeGlobalFallbackFlag =
    "__fitFileViewerRuntimeGlobalFallbackForTests";

export function setChartRuntime(runtime: unknown, zoomPlugin?: unknown): void {
    const registry = getChartRuntimeRegistry();
    registry.runtime = runtime;
    if (zoomPlugin !== undefined) {
        registry.zoomPlugin = zoomPlugin;
    }
}

export function clearChartRuntimeForTests(): void {
    const registry = getChartRuntimeRegistry();
    registry.runtime = undefined;
    registry.zoomPlugin = undefined;
}

export function resolveChartRuntime<T>(
    isRuntime: (value: unknown) => value is T
): T | null {
    for (const candidate of getChartRuntimeCandidates()) {
        if (isRuntime(candidate)) {
            return candidate;
        }
    }

    return null;
}

export function resolveChartZoomPlugin(): unknown {
    return getChartRuntimeRegistry().zoomPlugin ?? null;
}

function getChartRuntimeCandidates(): unknown[] {
    const registry = getChartRuntimeRegistry();
    return isRuntimeGlobalFallbackEnabled()
        ? [
              registry.runtime,
              getGlobalRuntimeCandidate("Chart"),
              getWindowRuntimeCandidate("Chart"),
          ]
        : [registry.runtime];
}

function getChartRuntimeRegistry(): ChartRuntimeRegistry {
    const chartGlobal = globalThis as typeof globalThis &
        Record<symbol, ChartRuntimeRegistry | undefined>;
    chartGlobal[chartRuntimeRegistryKey] ??= {};
    return chartGlobal[chartRuntimeRegistryKey];
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

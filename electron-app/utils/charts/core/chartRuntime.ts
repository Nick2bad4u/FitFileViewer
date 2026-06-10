interface ChartRuntimeRegistry {
    runtime?: unknown;
    zoomPlugin?: unknown;
}

const chartRuntimeRegistryKey = Symbol.for("fitfileviewer.chartRuntime");

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
    return [registry.runtime];
}

function getChartRuntimeRegistry(): ChartRuntimeRegistry {
    const chartGlobal = globalThis as typeof globalThis &
        Record<symbol, ChartRuntimeRegistry | undefined>;
    chartGlobal[chartRuntimeRegistryKey] ??= {};
    return chartGlobal[chartRuntimeRegistryKey];
}

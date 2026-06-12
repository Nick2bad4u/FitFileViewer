type ChartRuntimeRegistry = {
    runtime?: unknown;
    zoomPlugin?: unknown;
};

const chartRuntimeRegistry: ChartRuntimeRegistry = {};

export function setChartRuntime(runtime: unknown, zoomPlugin?: unknown): void {
    chartRuntimeRegistry.runtime = runtime;
    if (zoomPlugin !== undefined) {
        chartRuntimeRegistry.zoomPlugin = zoomPlugin;
    }
}

export function clearChartRuntimeForTests(): void {
    chartRuntimeRegistry.runtime = undefined;
    chartRuntimeRegistry.zoomPlugin = undefined;
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
    return chartRuntimeRegistry.zoomPlugin ?? null;
}

function getChartRuntimeCandidates(): unknown[] {
    return [chartRuntimeRegistry.runtime];
}

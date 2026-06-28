type ChartRuntimeRegistry = {
    runtime?: unknown;
    zoomPlugin?: unknown;
};

export type RegisteredChartRuntime = Readonly<{
    register: (...items: never[]) => unknown;
}>;

export type RegisteredChartZoomPlugin = Readonly<{
    id: string;
}>;

type ChartRuntimeCandidate = Readonly<{
    register?: unknown;
}>;

type ChartZoomPluginCandidate = Readonly<{
    id?: unknown;
}>;

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

export function isRegisteredChartRuntime(
    value: unknown
): value is RegisteredChartRuntime {
    if (!isObjectOrFunction(value)) {
        return false;
    }

    return typeof value.register === "function";
}

export function isRegisteredChartZoomPlugin(
    value: unknown
): value is RegisteredChartZoomPlugin {
    if (!isChartZoomPluginCandidate(value)) {
        return false;
    }

    return typeof value.id === "string" && value.id.length > 0;
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

function isObjectOrFunction(value: unknown): value is ChartRuntimeCandidate {
    return (
        (typeof value === "object" || typeof value === "function") &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isChartZoomPluginCandidate(
    value: unknown
): value is ChartZoomPluginCandidate {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

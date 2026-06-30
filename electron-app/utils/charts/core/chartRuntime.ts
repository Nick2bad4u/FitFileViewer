type ChartRuntimeRegistry = {
    runtime?: RegisteredChartRuntime;
    zoomPlugin?: RegisteredChartZoomPlugin;
};

export type RegisteredChartRuntime = Readonly<{
    register: (...items: never[]) => unknown;
}> | (new (...args: never[]) => unknown);

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
    if (isRegisteredChartRuntime(runtime)) {
        chartRuntimeRegistry.runtime = runtime;
    }
    if (isRegisteredChartZoomPlugin(zoomPlugin)) {
        chartRuntimeRegistry.zoomPlugin = zoomPlugin;
    }
}

export function registerChartRuntime(
    runtime: RegisteredChartRuntime,
    zoomPlugin: RegisteredChartZoomPlugin
): void {
    chartRuntimeRegistry.runtime = runtime;
    chartRuntimeRegistry.zoomPlugin = zoomPlugin;
}

export function clearChartRuntimeForTests(): void {
    delete chartRuntimeRegistry.runtime;
    delete chartRuntimeRegistry.zoomPlugin;
}

export function isRegisteredChartRuntime(
    value: unknown
): value is RegisteredChartRuntime {
    if (!isObjectOrFunction(value)) {
        return false;
    }

    return typeof value === "function" || typeof value.register === "function";
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

export function resolveChartZoomPlugin(): RegisteredChartZoomPlugin | null {
    return chartRuntimeRegistry.zoomPlugin ?? null;
}

function getChartRuntimeCandidates(): RegisteredChartRuntime[] {
    return chartRuntimeRegistry.runtime === undefined
        ? []
        : [chartRuntimeRegistry.runtime];
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

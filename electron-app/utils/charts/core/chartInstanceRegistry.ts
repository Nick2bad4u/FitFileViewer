type DestroyableChartInstance = {
    destroy?: unknown;
};

export type RegisteredChartInstance = object;

type CanvasBackedChartInstance = RegisteredChartInstance & {
    canvas?: unknown;
};

type ChartInstanceRegistry = {
    instances: RegisteredChartInstance[];
};

const chartInstanceRegistryKey = Symbol.for(
    "fitfileviewer.chartInstanceRegistry"
);

function getRegistry(): ChartInstanceRegistry {
    const registryGlobal = globalThis as typeof globalThis & {
        [chartInstanceRegistryKey]?: ChartInstanceRegistry;
    };
    registryGlobal[chartInstanceRegistryKey] ??= {
        instances: [],
    };
    return registryGlobal[chartInstanceRegistryKey];
}

function isRegisteredChartInstance(
    value: unknown
): value is RegisteredChartInstance {
    return value !== null && typeof value === "object";
}

function hasDestroy(
    value: RegisteredChartInstance
): value is RegisteredChartInstance & { destroy: () => void } {
    return typeof (value as DestroyableChartInstance).destroy === "function";
}

export function getRegisteredChartInstances(): RegisteredChartInstance[] {
    return getRegistry().instances;
}

export function getRegisteredChartInstanceCount(): number {
    return getRegisteredChartInstances().length;
}

export function getRegisteredChartInstanceForCanvas(
    canvas: HTMLCanvasElement
): RegisteredChartInstance | null {
    return (
        getRegisteredChartInstances().find(
            (chart): chart is CanvasBackedChartInstance =>
                (chart as CanvasBackedChartInstance).canvas === canvas
        ) ?? null
    );
}

export function registerChartInstance(chart: unknown): void {
    if (!isRegisteredChartInstance(chart)) {
        return;
    }

    const registry = getRegistry();
    registry.instances.push(chart);
}

export function setRegisteredChartInstances(
    charts: readonly unknown[]
): RegisteredChartInstance[] {
    const registry = getRegistry();
    registry.instances = charts.filter(isRegisteredChartInstance);
    return registry.instances;
}

export function clearRegisteredChartInstances(): void {
    setRegisteredChartInstances([]);
}

export function destroyRegisteredChartInstances(
    onError: (index: number, error: unknown) => void = () => undefined
): void {
    const charts = getRegisteredChartInstances();

    for (const [index, chart] of charts.entries()) {
        try {
            if (hasDestroy(chart)) {
                chart.destroy();
            }
        } catch (error) {
            onError(index, error);
        }
    }

    clearRegisteredChartInstances();
}

export function clearChartInstanceRegistryForTests(): void {
    const registryGlobal = globalThis as typeof globalThis & {
        [chartInstanceRegistryKey]?: ChartInstanceRegistry;
    };
    delete registryGlobal[chartInstanceRegistryKey];
}

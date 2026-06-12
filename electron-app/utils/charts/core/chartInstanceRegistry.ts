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

const chartInstanceRegistry: ChartInstanceRegistry = { instances: [] };

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
    return chartInstanceRegistry.instances;
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

    chartInstanceRegistry.instances.push(chart);
}

export function setRegisteredChartInstances(
    charts: readonly unknown[]
): RegisteredChartInstance[] {
    chartInstanceRegistry.instances = charts.filter(isRegisteredChartInstance);
    return chartInstanceRegistry.instances;
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
    clearRegisteredChartInstances();
}

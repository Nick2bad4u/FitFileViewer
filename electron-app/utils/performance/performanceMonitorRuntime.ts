type PerformanceMonitorPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface PerformanceMonitorRuntimeScope {
    readonly getPerformance?:
        | (() => PerformanceMonitorPerformanceRuntime | undefined)
        | undefined;
}

export interface PerformanceMonitorRuntime {
    nowPerformance: () => number;
}

const defaultPerformanceMonitorRuntimeScope: PerformanceMonitorRuntimeScope = {
    getPerformance: () => globalThis.performance,
};

function getRequiredPerformanceNow(
    scope: PerformanceMonitorRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    throw new TypeError("performanceMonitorRuntime requires performance.now");
}

export function getPerformanceMonitorRuntime(
    scope: PerformanceMonitorRuntimeScope = defaultPerformanceMonitorRuntimeScope
): PerformanceMonitorRuntime {
    return {
        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

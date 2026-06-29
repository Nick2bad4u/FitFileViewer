import { getBrowserPerformance } from "../runtime/browserRuntime.js";

type PerformanceMonitorPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface PerformanceMonitorRuntimeScope {
    readonly getPerformance: PerformanceMonitorRuntimeProvider<PerformanceMonitorPerformanceRuntime>;
}

export interface PerformanceMonitorRuntime {
    nowPerformance: () => number;
}

type PerformanceMonitorRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultPerformanceMonitorRuntimeScope: PerformanceMonitorRuntimeScope = {
    getPerformance: getBrowserPerformance,
};

function getRequiredPerformanceNow(
    getPerformance: () => PerformanceMonitorPerformanceRuntime | undefined
): () => number {
    const performance = getPerformance();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    throw new TypeError("performanceMonitorRuntime requires performance.now");
}

export function getPerformanceMonitorRuntime(
    scope: PerformanceMonitorRuntimeScope = defaultPerformanceMonitorRuntimeScope
): PerformanceMonitorRuntime {
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );

    return {
        nowPerformance(): number {
            return getRequiredPerformanceNow(getPerformance)();
        },
    };
}

function getRequiredProvider<T>(
    provider: PerformanceMonitorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `performanceMonitorRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}

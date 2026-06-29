import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../runtime/browserRuntime.js";

export interface LastAnimLogRuntimeScope {
    readonly getDateNow: LastAnimLogRuntimeProvider<() => number>;
    readonly getPerformance: LastAnimLogRuntimeProvider<
        Pick<Performance, "now">
    >;
    readonly getPerformanceNow: LastAnimLogRuntimeProvider<() => number>;
}

type LastAnimLogRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface LastAnimLogRuntime {
    readonly dateNow: () => number;
    readonly performanceNow: () => number;
}

function getScopedPerformanceNow(
    performanceRef: Pick<Performance, "now"> | undefined
): (() => number) | undefined {
    const performanceNow = performanceRef?.now;
    if (typeof performanceNow !== "function") {
        return undefined;
    }

    return () => performanceNow.call(performanceRef);
}

const defaultLastAnimLogRuntimeScope: LastAnimLogRuntimeScope = {
    getDateNow: getBrowserDateNow,
    getPerformance: getBrowserPerformance,
    getPerformanceNow: () => undefined,
};

function getRequiredDateNow(scope: LastAnimLogRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
    if (typeof dateNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: LastAnimLogRuntimeScope
): () => number {
    const performanceNow = getRequiredProvider(
        scope.getPerformanceNow,
        "performance.now"
    )();
    if (typeof performanceNow === "function") {
        return performanceNow;
    }

    const scopedPerformanceNow = getScopedPerformanceNow(
        getRequiredProvider(scope.getPerformance, "performance")()
    );
    if (typeof scopedPerformanceNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires performance.now");
    }

    return scopedPerformanceNow;
}

function getRequiredProvider<T>(
    provider: LastAnimLogRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `lastAnimLogRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

export function getLastAnimLogRuntime(
    scope: LastAnimLogRuntimeScope = defaultLastAnimLogRuntimeScope
): LastAnimLogRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        performanceNow(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

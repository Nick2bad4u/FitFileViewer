import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../runtime/browserRuntime.js";

export interface LastAnimLogRuntimeScope {
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
    readonly getPerformance:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
    readonly getPerformanceNow: (() => (() => number) | undefined) | undefined;
}

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
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires dateNow provider");
    }

    const dateNow = scope.getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: LastAnimLogRuntimeScope
): () => number {
    if (typeof scope.getPerformanceNow !== "function") {
        throw new TypeError(
            "lastAnimLogRuntime requires performance.now provider"
        );
    }

    const performanceNow = scope.getPerformanceNow();
    if (typeof performanceNow === "function") {
        return performanceNow;
    }

    if (typeof scope.getPerformance !== "function") {
        throw new TypeError("lastAnimLogRuntime requires performance provider");
    }

    const scopedPerformanceNow = getScopedPerformanceNow(
        scope.getPerformance()
    );
    if (typeof scopedPerformanceNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires performance.now");
    }

    return scopedPerformanceNow;
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

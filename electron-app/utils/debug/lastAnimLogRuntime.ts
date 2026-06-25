import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../runtime/browserRuntime.js";

export interface LastAnimLogRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
    readonly getPerformanceNow?: (() => (() => number) | undefined) | undefined;
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
};

function getRequiredDateNow(scope: LastAnimLogRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: LastAnimLogRuntimeScope
): () => number {
    const performanceNow =
        scope.getPerformanceNow?.() ??
        getScopedPerformanceNow(scope.getPerformance?.());
    if (typeof performanceNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires performance.now");
    }

    return performanceNow;
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

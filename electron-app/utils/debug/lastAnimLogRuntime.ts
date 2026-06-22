export interface LastAnimLogRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformanceNow?: (() => (() => number) | undefined) | undefined;
}

export interface LastAnimLogRuntime {
    readonly dateNow: () => number;
    readonly performanceNow: () => number;
}

function getDefaultPerformanceNow(): (() => number) | undefined {
    const performanceRef = (
        globalThis as Partial<Pick<typeof globalThis, "performance">>
    ).performance;
    const performanceNow = performanceRef?.now;
    if (typeof performanceNow !== "function") {
        return undefined;
    }

    return () => performanceNow.call(performanceRef);
}

const defaultLastAnimLogRuntimeScope: LastAnimLogRuntimeScope = {
    getDateNow: () => Date.now,
    getPerformanceNow: getDefaultPerformanceNow,
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
    const performanceNow = scope.getPerformanceNow?.();
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

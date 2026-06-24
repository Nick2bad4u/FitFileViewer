export interface TabRenderingManagerRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
    readonly getPerformanceNow?: (() => (() => number) | undefined) | undefined;
}

export interface TabRenderingManagerRuntime {
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

const defaultTabRenderingManagerRuntimeScope: TabRenderingManagerRuntimeScope = {
    getDateNow: () => Date.now,
    getPerformance: () => globalThis.performance,
};

function getRequiredDateNow(
    scope: TabRenderingManagerRuntimeScope
): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("tabRenderingManager requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: TabRenderingManagerRuntimeScope
): () => number {
    const performanceNow =
        scope.getPerformanceNow?.() ??
        getScopedPerformanceNow(scope.getPerformance?.());
    if (typeof performanceNow !== "function") {
        throw new TypeError("tabRenderingManager requires performance.now");
    }

    return performanceNow;
}

export function getTabRenderingManagerRuntime(
    scope: TabRenderingManagerRuntimeScope = defaultTabRenderingManagerRuntimeScope
): TabRenderingManagerRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        performanceNow(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

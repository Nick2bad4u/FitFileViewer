export interface RenderChartJSRuntimeScope {
    readonly CustomEventConstructor?: typeof CustomEvent | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly getCustomEventConstructor?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
    readonly getWindow?: (() => unknown) | undefined;
    readonly performance?: Pick<Performance, "now"> | undefined;
    readonly window?: unknown;
}

export interface RenderChartJSRuntime {
    getCustomEventConstructor: () => typeof CustomEvent | undefined;
    isWindowAvailable: () => boolean;
    now: () => number;
    nowPerformance: () => number;
}

const defaultRenderChartJSRuntimeScope: RenderChartJSRuntimeScope = {
    dateNow: Date.now,
    getCustomEventConstructor: () =>
        typeof CustomEvent === "function" ? CustomEvent : undefined,
    getPerformance: () => globalThis.performance,
    getWindow: () => globalThis.window,
};

function getRequiredDateNow(scope: RenderChartJSRuntimeScope): () => number {
    const dateNow = scope.dateNow;
    if (typeof dateNow !== "function") {
        throw new TypeError("renderChartJSRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: RenderChartJSRuntimeScope
): () => number {
    const performance = getScopePerformance(scope);
    const performanceNow = performance?.now;
    if (typeof performanceNow !== "function") {
        return getRequiredDateNow(scope);
    }

    return performanceNow.bind(performance);
}

function getScopeCustomEventConstructor(
    scope: RenderChartJSRuntimeScope
): typeof CustomEvent | undefined {
    return scope.getCustomEventConstructor?.() ?? scope.CustomEventConstructor;
}

function getScopePerformance(
    scope: RenderChartJSRuntimeScope
): Pick<Performance, "now"> | undefined {
    return scope.getPerformance?.() ?? scope.performance;
}

function getScopeWindow(scope: RenderChartJSRuntimeScope): unknown {
    return scope.getWindow?.() ?? scope.window;
}

export function getRenderChartJSRuntime(
    scope: RenderChartJSRuntimeScope = defaultRenderChartJSRuntimeScope
): RenderChartJSRuntime {
    return {
        getCustomEventConstructor(): typeof CustomEvent | undefined {
            return getScopeCustomEventConstructor(scope);
        },

        isWindowAvailable(): boolean {
            return getScopeWindow(scope) !== undefined;
        },

        now(): number {
            return getRequiredDateNow(scope)();
        },

        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

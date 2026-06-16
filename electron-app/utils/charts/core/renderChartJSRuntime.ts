export interface RenderChartJSRuntimeScope {
    readonly CustomEventConstructor?: typeof CustomEvent | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly getCustomEventConstructor?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getIsRendererScope?: (() => boolean | undefined) | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
    readonly performance?: Pick<Performance, "now"> | undefined;
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
    getIsRendererScope: () => Reflect.has(globalThis, "document"),
    getPerformance: () => globalThis.performance,
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

function getIsRendererScope(scope: RenderChartJSRuntimeScope): boolean {
    return scope.getIsRendererScope?.() ?? false;
}

export function getRenderChartJSRuntime(
    scope: RenderChartJSRuntimeScope = defaultRenderChartJSRuntimeScope
): RenderChartJSRuntime {
    return {
        getCustomEventConstructor(): typeof CustomEvent | undefined {
            return getScopeCustomEventConstructor(scope);
        },

        isWindowAvailable(): boolean {
            return getIsRendererScope(scope);
        },

        now(): number {
            return getRequiredDateNow(scope)();
        },

        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

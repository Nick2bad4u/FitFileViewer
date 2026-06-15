export interface RenderChartJSRuntimeScope {
    readonly CustomEventConstructor?: typeof CustomEvent | undefined;
    readonly dateNow?: (() => number) | undefined;
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
    get CustomEventConstructor() {
        return globalThis.CustomEvent;
    },
    dateNow: Date.now,
    get performance() {
        return globalThis.performance;
    },
    get window() {
        return globalThis.window;
    },
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
    const performanceNow = scope.performance?.now;
    if (typeof performanceNow !== "function") {
        return getRequiredDateNow(scope);
    }

    return performanceNow.bind(scope.performance);
}

export function getRenderChartJSRuntime(
    scope: RenderChartJSRuntimeScope = defaultRenderChartJSRuntimeScope
): RenderChartJSRuntime {
    return {
        getCustomEventConstructor(): typeof CustomEvent | undefined {
            return scope.CustomEventConstructor;
        },

        isWindowAvailable(): boolean {
            return scope.window !== undefined;
        },

        now(): number {
            return getRequiredDateNow(scope)();
        },

        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

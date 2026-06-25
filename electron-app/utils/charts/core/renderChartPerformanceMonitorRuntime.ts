import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

export interface RenderChartPerformanceMonitorRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
}

export interface RenderChartPerformanceMonitorRuntime {
    readonly dateNow: () => number;
    readonly nowPerformance: () => number;
}

const defaultRenderChartPerformanceMonitorRuntimeScope: RenderChartPerformanceMonitorRuntimeScope =
    {
        getDateNow: getBrowserDateNow,
        getPerformance: getBrowserPerformance,
    };

function getRequiredDateNow(
    scope: RenderChartPerformanceMonitorRuntimeScope
): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError(
            "renderChartPerformanceMonitorRuntime requires dateNow"
        );
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: RenderChartPerformanceMonitorRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow !== "function") {
        throw new TypeError(
            "renderChartPerformanceMonitorRuntime requires performance.now"
        );
    }

    return performanceNow.bind(performance);
}

export function getRenderChartPerformanceMonitorRuntime(
    scope: RenderChartPerformanceMonitorRuntimeScope = defaultRenderChartPerformanceMonitorRuntimeScope
): RenderChartPerformanceMonitorRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

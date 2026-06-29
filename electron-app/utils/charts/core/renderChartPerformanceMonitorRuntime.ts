import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

export interface RenderChartPerformanceMonitorRuntimeScope {
    readonly getDateNow: RenderChartPerformanceMonitorRuntimeProvider<
        () => number
    >;
    readonly getPerformance: RenderChartPerformanceMonitorRuntimeProvider<
        Pick<Performance, "now">
    >;
}

export interface RenderChartPerformanceMonitorRuntime {
    readonly dateNow: () => number;
    readonly nowPerformance: () => number;
}

type RenderChartPerformanceMonitorRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

const defaultRenderChartPerformanceMonitorRuntimeScope: RenderChartPerformanceMonitorRuntimeScope =
    {
        getDateNow: getBrowserDateNow,
        getPerformance: getBrowserPerformance,
    };

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError(
            "renderChartPerformanceMonitorRuntime requires dateNow"
        );
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    getPerformance: () => Pick<Performance, "now"> | undefined
): () => number {
    const performance = getPerformance();
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
    const getDateNow = getRequiredProvider(scope.getDateNow, "dateNow");
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );

    return {
        dateNow(): number {
            return getRequiredDateNow(getDateNow)();
        },
        nowPerformance(): number {
            return getRequiredPerformanceNow(getPerformance)();
        },
    };
}

function getRequiredProvider<T>(
    provider: RenderChartPerformanceMonitorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `renderChartPerformanceMonitorRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

import { getBrowserRendererPerformance } from "./rendererBrowserRuntime.js";

type StartupPerformanceMonitorPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface StartupPerformanceMonitorRuntimeScope {
    readonly getPerformance?:
        | (() => StartupPerformanceMonitorPerformanceRuntime | undefined)
        | undefined;
}

export interface StartupPerformanceMonitorRuntime {
    nowPerformance: () => number;
}

const defaultStartupPerformanceMonitorRuntimeScope: StartupPerformanceMonitorRuntimeScope =
    {
        getPerformance: getBrowserRendererPerformance,
    };

function getRequiredPerformanceNow(
    scope: StartupPerformanceMonitorRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    throw new TypeError(
        "startupPerformanceMonitorRuntime requires performance.now"
    );
}

export function getStartupPerformanceMonitorRuntime(
    scope: StartupPerformanceMonitorRuntimeScope = defaultStartupPerformanceMonitorRuntimeScope
): StartupPerformanceMonitorRuntime {
    return {
        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}

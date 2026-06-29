import { getBrowserPerformance } from "../utils/runtime/browserRuntime.js";

type StartupPerformanceMonitorPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface StartupPerformanceMonitorRuntimeScope {
    readonly getPerformance: StartupPerformanceMonitorRuntimeProvider<StartupPerformanceMonitorPerformanceRuntime>;
}

type StartupPerformanceMonitorRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface StartupPerformanceMonitorRuntime {
    nowPerformance: () => number;
}

const defaultStartupPerformanceMonitorRuntimeScope: StartupPerformanceMonitorRuntimeScope =
    {
        getPerformance: getBrowserPerformance,
    };

function getRequiredPerformanceNow(
    getPerformance: () =>
        | StartupPerformanceMonitorPerformanceRuntime
        | undefined
): () => number {
    const performance = getPerformance();
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
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );

    return {
        nowPerformance(): number {
            return getRequiredPerformanceNow(getPerformance)();
        },
    };
}

function getRequiredProvider<T>(
    provider: StartupPerformanceMonitorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `startupPerformanceMonitorRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

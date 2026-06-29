import { getBrowserPerformance } from "../runtime/browserRuntime.js";
import {
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    isDevelopmentEnvironment as isRuntimeDevelopmentEnvironment,
} from "../runtime/processEnvironment.js";

type PerformanceMonitorPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface PerformanceMonitorRuntimeScope {
    readonly getIsDevelopmentEnvironment: PerformanceMonitorRuntimeProvider<boolean>;
    readonly getPerformance: PerformanceMonitorRuntimeProvider<PerformanceMonitorPerformanceRuntime>;
    readonly getProcessEnvironmentValue:
        | ((name: string) => string | undefined)
        | undefined;
}

export interface PerformanceMonitorRuntime {
    getProcessEnvironmentValue: (name: string) => string | undefined;
    isDevelopmentEnvironment: () => boolean;
    nowPerformance: () => number;
}

type PerformanceMonitorRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultPerformanceMonitorRuntimeScope: PerformanceMonitorRuntimeScope = {
    getIsDevelopmentEnvironment: isRuntimeDevelopmentEnvironment,
    getPerformance: getBrowserPerformance,
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
};

function getRequiredPerformanceNow(
    getPerformance: () => PerformanceMonitorPerformanceRuntime | undefined
): () => number {
    const performance = getPerformance();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    throw new TypeError("performanceMonitorRuntime requires performance.now");
}

export function getPerformanceMonitorRuntime(
    scope: PerformanceMonitorRuntimeScope = defaultPerformanceMonitorRuntimeScope
): PerformanceMonitorRuntime {
    const getProcessEnvironmentValue = getRequiredProcessEnvironmentProvider(
            scope.getProcessEnvironmentValue
        ),
        getIsDevelopmentEnvironment = getRequiredProvider(
            scope.getIsDevelopmentEnvironment,
            "isDevelopmentEnvironment"
        ),
        getPerformance = getRequiredProvider(
            scope.getPerformance,
            "performance"
        );

    return {
        getProcessEnvironmentValue(name): string | undefined {
            return getProcessEnvironmentValue(name);
        },
        isDevelopmentEnvironment(): boolean {
            return getIsDevelopmentEnvironment() === true;
        },
        nowPerformance(): number {
            return getRequiredPerformanceNow(getPerformance)();
        },
    };
}

function getRequiredProcessEnvironmentProvider(
    provider: PerformanceMonitorRuntimeScope["getProcessEnvironmentValue"]
): (name: string) => string | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            "performanceMonitorRuntime requires a processEnvironmentValue provider"
        );
    }

    return provider;
}

function getRequiredProvider<T>(
    provider: PerformanceMonitorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `performanceMonitorRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}

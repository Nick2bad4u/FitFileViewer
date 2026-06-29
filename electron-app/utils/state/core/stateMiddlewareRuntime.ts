import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

export type StateMiddlewareDateNow = () => number;

export interface StateMiddlewarePerformance {
    readonly now?: (() => number) | undefined;
}

export interface StateMiddlewareRuntimeScope {
    readonly getDateNow: StateMiddlewareRuntimeProvider<StateMiddlewareDateNow>;
    readonly getPerformance: StateMiddlewareRuntimeProvider<StateMiddlewarePerformance>;
}

type StateMiddlewareRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface StateMiddlewareRuntime {
    readonly dateNow: () => number;
    readonly performanceNow: () => number;
}

const defaultStateMiddlewareRuntimeScope: StateMiddlewareRuntimeScope = {
    getDateNow: getBrowserDateNow,
    getPerformance: getBrowserPerformance,
};

export function getStateMiddlewareRuntime(
    scope: StateMiddlewareRuntimeScope = defaultStateMiddlewareRuntimeScope
): StateMiddlewareRuntime {
    return {
        dateNow(): number {
            const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
            if (typeof dateNow !== "function") {
                throw new TypeError("stateMiddleware requires dateNow");
            }

            return dateNow();
        },
        performanceNow(): number {
            const performance = getRequiredProvider(
                scope.getPerformance,
                "performance"
            )();
            const performanceNow = performance?.now;
            if (typeof performanceNow !== "function") {
                throw new TypeError("stateMiddleware requires performance.now");
            }

            return performanceNow.call(performance);
        },
    };
}

function getRequiredProvider<T>(
    provider: StateMiddlewareRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `stateMiddleware requires a ${providerName} provider`
        );
    }

    return provider;
}

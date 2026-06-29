import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

export type StateMiddlewareDateNow = () => number;

export interface StateMiddlewarePerformance {
    readonly now?: (() => number) | undefined;
}

export interface StateMiddlewareRuntimeScope {
    readonly getDateNow: (() => StateMiddlewareDateNow | undefined) | undefined;
    readonly getPerformance:
        | (() => StateMiddlewarePerformance | undefined)
        | undefined;
}

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
            if (typeof scope.getDateNow !== "function") {
                throw new TypeError(
                    "stateMiddleware requires a dateNow provider"
                );
            }

            const dateNow = scope.getDateNow();
            if (typeof dateNow !== "function") {
                throw new TypeError("stateMiddleware requires dateNow");
            }

            return dateNow();
        },
        performanceNow(): number {
            if (typeof scope.getPerformance !== "function") {
                throw new TypeError(
                    "stateMiddleware requires a performance provider"
                );
            }

            const performance = scope.getPerformance();
            const performanceNow = performance?.now;
            if (typeof performanceNow !== "function") {
                throw new TypeError("stateMiddleware requires performance.now");
            }

            return performanceNow.call(performance);
        },
    };
}

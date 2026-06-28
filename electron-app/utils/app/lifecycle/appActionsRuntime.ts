import { getBrowserPerformance } from "../../runtime/browserRuntime.js";

export interface AppActionsPerformance {
    readonly now?: (() => number) | undefined;
}

export interface AppActionsRuntimeScope {
    readonly getPerformance?:
        | (() => AppActionsPerformance | undefined)
        | undefined;
}

export interface AppActionsRuntime {
    readonly performanceNow: () => number;
}

const defaultAppActionsRuntimeScope: AppActionsRuntimeScope = {
    getPerformance: getBrowserPerformance,
};

export function getAppActionsRuntime(
    scope: AppActionsRuntimeScope = defaultAppActionsRuntimeScope
): AppActionsRuntime {
    return {
        performanceNow(): number {
            const performance = scope.getPerformance?.();
            const performanceNow = performance?.now;
            if (typeof performanceNow !== "function") {
                throw new TypeError("AppActions requires performance.now");
            }

            return performanceNow.call(performance);
        },
    };
}

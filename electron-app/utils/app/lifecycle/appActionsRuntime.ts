export type AppActionsDateNow = () => number;

export interface AppActionsPerformance {
    readonly now?: (() => number) | undefined;
}

export interface AppActionsRuntimeScope {
    readonly getDateNow?: (() => AppActionsDateNow | undefined) | undefined;
    readonly getPerformance?:
        | (() => AppActionsPerformance | undefined)
        | undefined;
}

export interface AppActionsRuntime {
    readonly dateNow: () => number;
    readonly performanceNow: () => number;
}

const defaultAppActionsRuntimeScope: AppActionsRuntimeScope = {
    getDateNow: () => Date.now,
    getPerformance: () => globalThis.performance,
};

export function getAppActionsRuntime(
    scope: AppActionsRuntimeScope = defaultAppActionsRuntimeScope
): AppActionsRuntime {
    return {
        dateNow(): number {
            const dateNow = scope.getDateNow?.();
            if (typeof dateNow !== "function") {
                throw new TypeError("AppActions requires dateNow");
            }

            return dateNow();
        },
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

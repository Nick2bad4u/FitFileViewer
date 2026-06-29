import { getBrowserPerformance } from "../../runtime/browserRuntime.js";

export interface AppActionsPerformance {
    readonly now?: (() => number) | undefined;
}

export interface AppActionsRuntimeScope {
    readonly getPerformance: AppActionsRuntimeProvider<AppActionsPerformance>;
}

export interface AppActionsRuntime {
    readonly performanceNow: () => number;
}

const defaultAppActionsRuntimeScope: AppActionsRuntimeScope = {
    getPerformance: getBrowserPerformance,
};

type AppActionsRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredProvider<T>(
    provider: AppActionsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`AppActions requires ${providerName} provider`);
    }

    return provider;
}

export function getAppActionsRuntime(
    scope: AppActionsRuntimeScope = defaultAppActionsRuntimeScope
): AppActionsRuntime {
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );

    return {
        performanceNow(): number {
            const performance = getPerformance();
            const performanceNow = performance?.now;
            if (typeof performanceNow !== "function") {
                throw new TypeError("AppActions requires performance.now");
            }

            return performanceNow.call(performance);
        },
    };
}

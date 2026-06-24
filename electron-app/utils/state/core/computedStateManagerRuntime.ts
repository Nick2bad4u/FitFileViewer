export interface ComputedStateManagerRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getPerformance?:
        | (() => Pick<Performance, "now"> | undefined)
        | undefined;
}

export interface ComputedStateManagerRuntime {
    dateNow: () => number;
    isDarkSchemePreferred: () => boolean;
    nowPerformance: () => number;
}

const defaultComputedStateManagerRuntimeScope: ComputedStateManagerRuntimeScope =
    {
        getDateNow: () => Date.now,
        getMatchMedia: () => globalThis.matchMedia,
        getPerformance: () => globalThis.performance,
    };

export function getComputedStateManagerRuntime(
    scope: ComputedStateManagerRuntimeScope = defaultComputedStateManagerRuntimeScope
): ComputedStateManagerRuntime {
    return {
        dateNow(): number {
            const dateNow = scope.getDateNow?.();
            if (typeof dateNow !== "function") {
                throw new TypeError("computedStateManager requires dateNow");
            }

            return dateNow();
        },

        isDarkSchemePreferred(): boolean {
            const matchMedia = scope.getMatchMedia?.();
            return Boolean(
                matchMedia?.("(prefers-color-scheme: dark)").matches
            );
        },

        nowPerformance(): number {
            const performance = scope.getPerformance?.();
            const performanceNow = performance?.now;
            if (typeof performanceNow !== "function") {
                throw new TypeError(
                    "computedStateManager requires performance.now"
                );
            }

            return performanceNow.bind(performance)();
        },
    };
}

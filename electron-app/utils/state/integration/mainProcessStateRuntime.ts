type MainProcessPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface MainProcessStateRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getPerformance?:
        | (() => MainProcessPerformanceRuntime | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export type MainProcessStateTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MainProcessStateRuntime {
    clearTimeout: (handle: MainProcessStateTimer) => void;
    monotonicNowMs: () => number;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MainProcessStateTimer;
}

const defaultMainProcessStateRuntimeScope: MainProcessStateRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout.bind(globalThis),
    dateNow: Date.now,
    getPerformance: () => globalThis.performance,
    getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
};

function getRequiredMonotonicNow(
    scope: MainProcessStateRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    const dateNow = scope.dateNow;
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("mainProcessStateRuntime requires a clock");
}

export function getMainProcessStateRuntime(
    scope: MainProcessStateRuntimeScope = defaultMainProcessStateRuntimeScope
): MainProcessStateRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        monotonicNowMs(): number {
            return getRequiredMonotonicNow(scope)();
        },
        setTimeout(callback, delayMs): MainProcessStateTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

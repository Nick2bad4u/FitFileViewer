export interface MainProcessStateRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly performance?:
        | {
              readonly now?: (() => number) | undefined;
          }
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
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
    get clearTimeout() {
        return globalThis.clearTimeout.bind(globalThis);
    },
    dateNow: Date.now,
    get performance() {
        return globalThis.performance;
    },
    get setTimeout() {
        return globalThis.setTimeout.bind(globalThis);
    },
};

function getRequiredMonotonicNow(
    scope: MainProcessStateRuntimeScope
): () => number {
    const performanceNow = scope.performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(scope.performance);
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
            const clearTimeoutRef = scope.clearTimeout;
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
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

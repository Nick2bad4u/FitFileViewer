export type StateDevToolsIntervalHandle = ReturnType<
    typeof globalThis.setInterval
>;

export type StateDevToolsPerformanceRuntime = {
    readonly memory?: unknown;
    readonly now?: (() => number) | undefined;
};

export interface StateDevToolsRuntimeScope {
    readonly getClearInterval?:
        | (() => typeof globalThis.clearInterval | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getLocation?:
        | (() =>
              | {
                    readonly hostname?: string;
                    readonly protocol?: string;
                }
              | undefined)
        | undefined;
    readonly getPerformance?:
        | (() => StateDevToolsPerformanceRuntime | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => typeof globalThis.setInterval | undefined)
        | undefined;
    readonly getIsRendererScope?: (() => boolean | undefined) | undefined;
}

export interface StateDevToolsRuntime {
    clearInterval: (handle: StateDevToolsIntervalHandle) => void;
    dateNow: () => number;
    getPerformanceMemory: () => unknown;
    isDevelopmentScope: () => boolean;
    performanceNow: () => number;
    setInterval: (
        callback: () => void,
        delay: number
    ) => StateDevToolsIntervalHandle;
}

const defaultStateDevToolsRuntimeScope: StateDevToolsRuntimeScope = {
    getClearInterval: () => globalThis.clearInterval,
    getDateNow: () => Date.now,
    getIsRendererScope: () => Reflect.has(globalThis, "document"),
    getLocation: () => globalThis.location,
    getPerformance: () => globalThis.performance,
    getSetInterval: () => globalThis.setInterval,
};

function getRequiredDateNow(scope: StateDevToolsRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("stateDevToolsRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: StateDevToolsRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow !== "function") {
        throw new TypeError("stateDevToolsRuntime requires performance.now");
    }

    return performanceNow.bind(performance);
}

function getScopeClearInterval(
    scope: StateDevToolsRuntimeScope
): typeof globalThis.clearInterval | undefined {
    return scope.getClearInterval?.();
}

function getScopeLocation(scope: StateDevToolsRuntimeScope):
    | {
          readonly hostname?: string;
          readonly protocol?: string;
      }
    | undefined {
    return scope.getLocation?.();
}

function getScopeSetInterval(
    scope: StateDevToolsRuntimeScope
): typeof globalThis.setInterval | undefined {
    return scope.getSetInterval?.();
}

function getIsRendererScope(scope: StateDevToolsRuntimeScope): boolean {
    return scope.getIsRendererScope?.() ?? false;
}

function isLocalHost(hostname: unknown): boolean {
    return hostname === "localhost" || hostname === "127.0.0.1";
}

function isFileProtocol(protocol: unknown): boolean {
    return protocol === "file:";
}

export function getStateDevToolsRuntime(
    scope: StateDevToolsRuntimeScope = defaultStateDevToolsRuntimeScope
): StateDevToolsRuntime {
    return {
        clearInterval(handle): void {
            const clearIntervalImplementation = getScopeClearInterval(scope);
            if (typeof clearIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires clearInterval"
                );
            }

            clearIntervalImplementation(handle);
        },
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        getPerformanceMemory(): unknown {
            return scope.getPerformance?.()?.memory;
        },
        isDevelopmentScope(): boolean {
            const location = getScopeLocation(scope);
            return (
                getIsRendererScope(scope) &&
                (isLocalHost(location?.hostname) ||
                    isFileProtocol(location?.protocol))
            );
        },
        performanceNow(): number {
            return getRequiredPerformanceNow(scope)();
        },
        setInterval(callback, delay): StateDevToolsIntervalHandle {
            const setIntervalImplementation = getScopeSetInterval(scope);
            if (typeof setIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires setInterval"
                );
            }

            return setIntervalImplementation(callback, delay);
        },
    };
}

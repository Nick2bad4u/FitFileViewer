export type StateDevToolsIntervalHandle = ReturnType<
    typeof globalThis.setInterval
>;

export interface StateDevToolsRuntimeScope {
    readonly clearInterval?: typeof globalThis.clearInterval;
    readonly getClearInterval?:
        | (() => typeof globalThis.clearInterval | undefined)
        | undefined;
    readonly getLocation?:
        | (() =>
              | {
                    readonly hostname?: string;
                    readonly protocol?: string;
                }
              | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => typeof globalThis.setInterval | undefined)
        | undefined;
    readonly getWindow?: (() => unknown) | undefined;
    readonly location?:
        | {
              readonly hostname?: string;
              readonly protocol?: string;
          }
        | undefined;
    readonly setInterval?: typeof globalThis.setInterval;
    readonly window?: unknown;
}

export interface StateDevToolsRuntime {
    clearInterval: (handle: StateDevToolsIntervalHandle) => void;
    isDevelopmentScope: () => boolean;
    setInterval: (
        callback: () => void,
        delay: number
    ) => StateDevToolsIntervalHandle;
}

const defaultStateDevToolsRuntimeScope: StateDevToolsRuntimeScope = {
    getClearInterval: () => globalThis.clearInterval,
    getLocation: () => globalThis.location,
    getSetInterval: () => globalThis.setInterval,
    getWindow: () => globalThis.window,
};

function getScopeClearInterval(
    scope: StateDevToolsRuntimeScope
): typeof globalThis.clearInterval | undefined {
    return scope.getClearInterval?.() ?? scope.clearInterval;
}

function getScopeLocation(
    scope: StateDevToolsRuntimeScope
):
    | {
          readonly hostname?: string;
          readonly protocol?: string;
      }
    | undefined {
    return scope.getLocation?.() ?? scope.location;
}

function getScopeSetInterval(
    scope: StateDevToolsRuntimeScope
): typeof globalThis.setInterval | undefined {
    return scope.getSetInterval?.() ?? scope.setInterval;
}

function getScopeWindow(scope: StateDevToolsRuntimeScope): unknown {
    return scope.getWindow?.() ?? scope.window;
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
        isDevelopmentScope(): boolean {
            const location = getScopeLocation(scope);
            return (
                getScopeWindow(scope) !== undefined &&
                (isLocalHost(location?.hostname) ||
                    isFileProtocol(location?.protocol))
            );
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

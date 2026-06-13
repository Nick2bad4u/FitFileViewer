export type StateDevToolsIntervalHandle = ReturnType<
    typeof globalThis.setInterval
>;

export interface StateDevToolsRuntimeScope {
    readonly clearInterval?: typeof globalThis.clearInterval;
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

function isLocalHost(hostname: unknown): boolean {
    return hostname === "localhost" || hostname === "127.0.0.1";
}

function isFileProtocol(protocol: unknown): boolean {
    return protocol === "file:";
}

export function getStateDevToolsRuntime(
    scope: StateDevToolsRuntimeScope = globalThis
): StateDevToolsRuntime {
    return {
        clearInterval(handle): void {
            const clearIntervalImplementation = scope.clearInterval;
            if (typeof clearIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires clearInterval"
                );
            }

            clearIntervalImplementation(handle);
        },
        isDevelopmentScope(): boolean {
            return (
                scope.window !== undefined &&
                (isLocalHost(scope.location?.hostname) ||
                    isFileProtocol(scope.location?.protocol))
            );
        },
        setInterval(callback, delay): StateDevToolsIntervalHandle {
            const setIntervalImplementation = scope.setInterval;
            if (typeof setIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires setInterval"
                );
            }

            return setIntervalImplementation(callback, delay);
        },
    };
}

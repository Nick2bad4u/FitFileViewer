export interface StateDevToolsRuntimeScope {
    readonly location?:
        | {
              readonly hostname?: string;
              readonly protocol?: string;
          }
        | undefined;
    readonly window?: unknown;
}

export interface StateDevToolsRuntime {
    isDevelopmentScope: () => boolean;
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
        isDevelopmentScope(): boolean {
            return (
                scope.window !== undefined &&
                (isLocalHost(scope.location?.hostname) ||
                    isFileProtocol(scope.location?.protocol))
            );
        },
    };
}

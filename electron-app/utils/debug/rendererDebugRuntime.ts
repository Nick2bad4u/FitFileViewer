export interface RendererDebugRuntimeScope {
    readonly window?: unknown;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

export function getRendererDebugRuntime(
    scope: RendererDebugRuntimeScope = globalThis
): RendererDebugRuntime {
    return {
        isRendererDebugLoggingAvailable(enabled): boolean {
            return scope.window !== undefined && enabled;
        },
    };
}

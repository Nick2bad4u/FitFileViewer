export interface RendererDebugRuntimeScope {
    readonly window?: unknown;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = globalThis;

export function getRendererDebugRuntime(
    scope: RendererDebugRuntimeScope = defaultRendererDebugRuntimeScope
): RendererDebugRuntime {
    return {
        isRendererDebugLoggingAvailable(enabled): boolean {
            return scope.window !== undefined && enabled;
        },
    };
}

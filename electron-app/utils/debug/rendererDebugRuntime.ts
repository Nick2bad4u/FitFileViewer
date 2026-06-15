export interface RendererDebugRuntimeScope {
    readonly getWindow?: (() => unknown) | undefined;
    readonly window?: unknown;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = {
    getWindow: () => globalThis.window,
};

function getScopeWindow(scope: RendererDebugRuntimeScope): unknown {
    return scope.getWindow?.() ?? scope.window;
}

export function getRendererDebugRuntime(
    scope: RendererDebugRuntimeScope = defaultRendererDebugRuntimeScope
): RendererDebugRuntime {
    return {
        isRendererDebugLoggingAvailable(enabled): boolean {
            return getScopeWindow(scope) !== undefined && enabled;
        },
    };
}

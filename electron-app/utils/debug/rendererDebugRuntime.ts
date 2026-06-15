export interface RendererDebugRuntimeScope {
    readonly getIsRendererScope?: (() => boolean) | undefined;
    readonly isRendererScope?: boolean | undefined;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = {
    getIsRendererScope: () => globalThis.document !== undefined,
};

function getIsRendererScope(scope: RendererDebugRuntimeScope): boolean {
    return scope.getIsRendererScope?.() ?? scope.isRendererScope ?? false;
}

export function getRendererDebugRuntime(
    scope: RendererDebugRuntimeScope = defaultRendererDebugRuntimeScope
): RendererDebugRuntime {
    return {
        isRendererDebugLoggingAvailable(enabled): boolean {
            return getIsRendererScope(scope) && enabled;
        },
    };
}

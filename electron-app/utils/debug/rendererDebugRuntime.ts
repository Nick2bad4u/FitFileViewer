import { getBrowserDocument } from "../runtime/browserRuntime.js";

export interface RendererDebugRuntimeScope {
    readonly getIsRendererScope?: (() => boolean | undefined) | undefined;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = {
    getIsRendererScope: () => getBrowserDocument() !== undefined,
};

function getIsRendererScope(scope: RendererDebugRuntimeScope): boolean {
    return scope.getIsRendererScope?.() ?? false;
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

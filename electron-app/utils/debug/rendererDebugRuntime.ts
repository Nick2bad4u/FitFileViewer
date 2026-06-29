import { getBrowserDocument } from "../runtime/browserRuntime.js";

export interface RendererDebugRuntimeScope {
    readonly getIsRendererScope: (() => boolean | undefined) | undefined;
}

export interface RendererDebugRuntime {
    isRendererDebugLoggingAvailable: (enabled: boolean) => boolean;
}

const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = {
    getIsRendererScope: () => getBrowserDocument() !== undefined,
};

function getIsRendererScope(scope: RendererDebugRuntimeScope): boolean {
    const getIsRendererScope = scope.getIsRendererScope;
    if (typeof getIsRendererScope !== "function") {
        throw new TypeError("rendererDebugRuntime requires renderer provider");
    }

    return getIsRendererScope() ?? false;
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

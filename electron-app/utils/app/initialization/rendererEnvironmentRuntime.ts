export interface RendererEnvironmentRuntimeScope {
    readonly getGlobalScope?: (() => object | undefined) | undefined;
}

export interface RendererEnvironmentRuntime {
    getDefaultRendererEnvironmentScope: () => object;
}

const defaultRendererEnvironmentRuntimeScope: RendererEnvironmentRuntimeScope =
    {
        getGlobalScope: () => globalThis,
    };

function getScopeGlobal(
    scope: RendererEnvironmentRuntimeScope
): object | undefined {
    return scope.getGlobalScope?.();
}

export function getRendererEnvironmentRuntime(
    scope: RendererEnvironmentRuntimeScope = defaultRendererEnvironmentRuntimeScope
): RendererEnvironmentRuntime {
    return {
        getDefaultRendererEnvironmentScope(): object {
            return getScopeGlobal(scope) ?? {};
        },
    };
}

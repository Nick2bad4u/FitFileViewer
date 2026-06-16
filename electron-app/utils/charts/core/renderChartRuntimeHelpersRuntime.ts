export interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

export interface RenderChartRuntimeEnvironment {
    getThemeConfig?: unknown;
    process?: ProcessShim;
}

export interface RenderChartRuntimeHelpersRuntimeScope {
    readonly getChartRuntimeEnvironment?:
        | (() => RenderChartRuntimeEnvironment | undefined)
        | undefined;
}

export interface RenderChartRuntimeHelpersRuntime {
    readonly getMutableChartRuntimeEnvironment: () => RenderChartRuntimeEnvironment;
}

const defaultRenderChartRuntimeHelpersRuntimeScope: RenderChartRuntimeHelpersRuntimeScope =
    {
        getChartRuntimeEnvironment: () => globalThis,
    };

function getScopeChartRuntimeEnvironment(
    scope: RenderChartRuntimeHelpersRuntimeScope
): RenderChartRuntimeEnvironment | undefined {
    return scope.getChartRuntimeEnvironment?.();
}

export function getRenderChartRuntimeHelpersRuntime(
    scope: RenderChartRuntimeHelpersRuntimeScope = defaultRenderChartRuntimeHelpersRuntimeScope
): RenderChartRuntimeHelpersRuntime {
    return {
        getMutableChartRuntimeEnvironment(): RenderChartRuntimeEnvironment {
            return getScopeChartRuntimeEnvironment(scope) ?? {};
        },
    };
}

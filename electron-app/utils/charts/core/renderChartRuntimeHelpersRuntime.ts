export interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

export interface RenderChartRuntimeEnvironment {
    getThemeConfig?: unknown;
    process?: ProcessShim;
}

export interface RenderChartRuntimeHelpersRuntimeScope {
    readonly chartRuntimeEnvironment?:
        | RenderChartRuntimeEnvironment
        | undefined;
    readonly getChartRuntimeEnvironment?:
        | (() => RenderChartRuntimeEnvironment | undefined)
        | undefined;
}

export interface RenderChartRuntimeHelpersRuntime {
    getMutableChartRuntimeEnvironment(): RenderChartRuntimeEnvironment;
}

const defaultRenderChartRuntimeHelpersRuntimeScope: RenderChartRuntimeHelpersRuntimeScope =
    {
        getChartRuntimeEnvironment: () => globalThis,
    };

function getScopeChartRuntimeEnvironment(
    scope: RenderChartRuntimeHelpersRuntimeScope
): RenderChartRuntimeEnvironment | undefined {
    return (
        scope.getChartRuntimeEnvironment?.() ?? scope.chartRuntimeEnvironment
    );
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

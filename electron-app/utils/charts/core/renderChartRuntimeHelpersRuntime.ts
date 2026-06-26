import {
    getRuntimeProcess,
    setRuntimeProcess,
} from "../../runtime/processEnvironment.js";

export interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

export interface RenderChartRuntimeHelpersRuntimeScope {
    readonly getProcess?: (() => unknown) | undefined;
    readonly setProcess?: ((processShim: ProcessShim) => void) | undefined;
}

export interface RenderChartRuntimeHelpersRuntime {
    readonly ensureProcessShim: () => ProcessShim;
    readonly getProcessShim: () => ProcessShim | null;
}

const defaultRenderChartRuntimeHelpersRuntimeScope: RenderChartRuntimeHelpersRuntimeScope =
    {
        getProcess: getRuntimeProcess,
        setProcess: setRuntimeProcess,
    };

function getScopeProcess(
    scope: RenderChartRuntimeHelpersRuntimeScope
): ProcessShim | null {
    const processShim = scope.getProcess?.();

    return isProcessShim(processShim) ? processShim : null;
}

function isProcessShim(value: unknown): value is ProcessShim {
    return typeof value === "object" && value !== null;
}

export function getRenderChartRuntimeHelpersRuntime(
    scope: RenderChartRuntimeHelpersRuntimeScope = defaultRenderChartRuntimeHelpersRuntimeScope
): RenderChartRuntimeHelpersRuntime {
    return {
        ensureProcessShim(): ProcessShim {
            const processShim = getScopeProcess(scope);
            if (processShim !== null) {
                return processShim;
            }

            const nextProcessShim: ProcessShim = {};
            scope.setProcess?.(nextProcessShim);

            return nextProcessShim;
        },

        getProcessShim(): ProcessShim | null {
            return getScopeProcess(scope);
        },
    };
}

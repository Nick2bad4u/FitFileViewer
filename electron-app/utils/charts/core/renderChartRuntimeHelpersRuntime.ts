import {
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    getRuntimeProcess,
    setRuntimeProcess,
} from "../../runtime/processEnvironment.js";

export interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

export interface RenderChartRuntimeHelpersRuntimeScope {
    readonly getProcessEnvironmentValue?:
        | ((name: string) => string | undefined)
        | undefined;
    readonly getProcess?: (() => unknown) | undefined;
    readonly setProcess?: ((processShim: ProcessShim) => void) | undefined;
}

export interface RenderChartRuntimeHelpersRuntime {
    readonly ensureProcessShim: () => ProcessShim;
    readonly getProcessEnvironmentValue: (name: string) => string | undefined;
    readonly getProcessShim: () => ProcessShim | null;
}

const defaultRenderChartRuntimeHelpersRuntimeScope: RenderChartRuntimeHelpersRuntimeScope =
    {
        getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
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

function getScopeProcessEnvironmentValue(
    scope: RenderChartRuntimeHelpersRuntimeScope,
    name: string
): string | undefined {
    const explicitValue = scope.getProcessEnvironmentValue?.(name);
    if (typeof explicitValue === "string") {
        return explicitValue;
    }

    const processShim = getScopeProcess(scope),
        environment = processShim?.env;
    if (typeof environment !== "object" || environment === null) {
        return undefined;
    }

    const value = environment[name];
    return typeof value === "string" ? value : undefined;
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

        getProcessEnvironmentValue(name: string): string | undefined {
            return getScopeProcessEnvironmentValue(scope, name);
        },

        getProcessShim(): ProcessShim | null {
            return getScopeProcess(scope);
        },
    };
}

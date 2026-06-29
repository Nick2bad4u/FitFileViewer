import { getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue } from "../../utils/runtime/processEnvironment.js";

type LogWithContextRuntimeProvider<T> = T | undefined;

export interface LogWithContextRuntimeScope {
    readonly getProcessEnvironmentValue: LogWithContextRuntimeProvider<
        (name: string) => string | undefined
    >;
}

export interface LogWithContextRuntime {
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
}

const defaultLogWithContextRuntimeScope: LogWithContextRuntimeScope = {
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
};

function getRequiredProvider<T>(
    provider: LogWithContextRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `logWithContextRuntime requires ${providerName} provider`
    );
}

export function getLogWithContextRuntime(
    scope: LogWithContextRuntimeScope = defaultLogWithContextRuntimeScope
): LogWithContextRuntime {
    return {
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessEnvironmentValue,
                "processEnvironmentValue"
            )(name);
        },
    };
}

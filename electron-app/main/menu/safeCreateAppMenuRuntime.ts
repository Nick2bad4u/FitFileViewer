import { getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue } from "../../utils/runtime/processEnvironment.js";

type SafeCreateAppMenuRuntimeProvider<T> = T | undefined;

export interface SafeCreateAppMenuRuntimeScope {
    readonly getProcessEnvironmentValue: SafeCreateAppMenuRuntimeProvider<
        (name: string) => string | undefined
    >;
}

export interface SafeCreateAppMenuRuntime {
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
}

const defaultSafeCreateAppMenuRuntimeScope: SafeCreateAppMenuRuntimeScope = {
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
};

function getRequiredProvider<T>(
    provider: SafeCreateAppMenuRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `safeCreateAppMenuRuntime requires ${providerName} provider`
    );
}

export function getSafeCreateAppMenuRuntime(
    scope: SafeCreateAppMenuRuntimeScope = defaultSafeCreateAppMenuRuntimeScope
): SafeCreateAppMenuRuntime {
    return {
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessEnvironmentValue,
                "processEnvironmentValue"
            )(name);
        },
    };
}

import {
    getProcessCurrentWorkingDirectory as getRuntimeProcessCurrentWorkingDirectory,
    getProcessStringValue as getRuntimeProcessStringValue,
    getProcessVersionValue as getRuntimeProcessVersionValue,
    type RuntimeProcessStringPropertyName,
} from "../../utils/runtime/processEnvironment.js";

type RegisterInfoHandlersRuntimeProvider<T> = T | undefined;

export type RegisterInfoHandlersProcessStringName =
    RuntimeProcessStringPropertyName;

export interface RegisterInfoHandlersRuntimeScope {
    readonly getProcessCurrentWorkingDirectory: RegisterInfoHandlersRuntimeProvider<
        () => string | undefined
    >;
    readonly getProcessStringValue: RegisterInfoHandlersRuntimeProvider<
        (name: RegisterInfoHandlersProcessStringName) => string | undefined
    >;
    readonly getProcessVersionValue: RegisterInfoHandlersRuntimeProvider<
        (name: string) => string | undefined
    >;
}

export interface RegisterInfoHandlersRuntime {
    readonly getProcessCurrentWorkingDirectory: () => string | undefined;
    readonly getProcessStringValue: (
        name: RegisterInfoHandlersProcessStringName
    ) => string | undefined;
    readonly getProcessVersionValue: (name: string) => string | undefined;
}

const defaultRegisterInfoHandlersRuntimeScope: RegisterInfoHandlersRuntimeScope =
    {
        getProcessCurrentWorkingDirectory:
            getRuntimeProcessCurrentWorkingDirectory,
        getProcessStringValue: getRuntimeProcessStringValue,
        getProcessVersionValue: getRuntimeProcessVersionValue,
    };

function getRequiredProvider<T>(
    provider: RegisterInfoHandlersRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `registerInfoHandlersRuntime requires ${providerName} provider`
    );
}

export function getRegisterInfoHandlersRuntime(
    scope: RegisterInfoHandlersRuntimeScope = defaultRegisterInfoHandlersRuntimeScope
): RegisterInfoHandlersRuntime {
    return {
        getProcessCurrentWorkingDirectory(): string | undefined {
            return getRequiredProvider(
                scope.getProcessCurrentWorkingDirectory,
                "processCurrentWorkingDirectory"
            )();
        },
        getProcessStringValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessStringValue,
                "processStringValue"
            )(name);
        },
        getProcessVersionValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessVersionValue,
                "processVersionValue"
            )(name);
        },
    };
}

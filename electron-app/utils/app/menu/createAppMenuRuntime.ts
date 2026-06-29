import {
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    getProcessStringValue as getRuntimeProcessStringValue,
    type RuntimeProcessStringPropertyName,
} from "../../runtime/processEnvironment.js";

export type CreateAppMenuProcessStringName = RuntimeProcessStringPropertyName;

type CreateAppMenuRuntimeProvider<T> =
    | ((name: string) => T | undefined)
    | undefined;
type CreateAppMenuProcessStringProvider =
    | ((name: RuntimeProcessStringPropertyName) => string | undefined)
    | undefined;

export interface CreateAppMenuRuntimeScope {
    readonly getProcessEnvironmentValue: CreateAppMenuRuntimeProvider<string>;
    readonly getProcessStringValue: CreateAppMenuProcessStringProvider;
}

export interface CreateAppMenuRuntime {
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
    readonly getProcessStringValue: (
        name: CreateAppMenuProcessStringName
    ) => string | undefined;
}

const defaultCreateAppMenuRuntimeScope: CreateAppMenuRuntimeScope = {
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
    getProcessStringValue: getRuntimeProcessStringValue,
};

function getRequiredProvider<TName extends string, TValue>(
    provider: ((name: TName) => TValue | undefined) | undefined,
    providerName: string
): (name: TName) => TValue | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `createAppMenu requires ${providerName} provider`
        );
    }

    return provider;
}

export function getCreateAppMenuRuntime(
    scope: CreateAppMenuRuntimeScope = defaultCreateAppMenuRuntimeScope
): CreateAppMenuRuntime {
    return {
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessEnvironmentValue,
                "processEnvironmentValue"
            )(name);
        },
        getProcessStringValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessStringValue,
                "processStringValue"
            )(name);
        },
    };
}

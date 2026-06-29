import { getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue } from "./utils/runtime/processEnvironment.js";

type WindowStateRuntimeProvider<T> =
    | ((name: string) => T | undefined)
    | undefined;

export interface WindowStateRuntimeScope {
    readonly getProcessEnvironmentValue: WindowStateRuntimeProvider<string>;
}

export interface WindowStateRuntime {
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
}

const defaultWindowStateRuntimeScope: WindowStateRuntimeScope = {
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
};

function getRequiredProvider<T>(
    provider: WindowStateRuntimeProvider<T>,
    providerName: string
): (name: string) => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `windowStateRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

export function getWindowStateRuntime(
    scope: WindowStateRuntimeScope = defaultWindowStateRuntimeScope
): WindowStateRuntime {
    return {
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessEnvironmentValue,
                "processEnvironmentValue"
            )(name);
        },
    };
}

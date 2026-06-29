import {
    getProcessArgumentValues as getRuntimeProcessArgumentValues,
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    getProcessStringValue as getRuntimeProcessStringValue,
    isDevelopmentEnvironment as isRuntimeDevelopmentEnvironment,
    isTestEnvironment as isRuntimeTestEnvironment,
    type RuntimeProcessStringPropertyName,
} from "../../utils/runtime/processEnvironment.js";

type SetupApplicationEventHandlersRuntimeProvider<T> = T | undefined;
export type SetupApplicationEventHandlersProcessStringName =
    RuntimeProcessStringPropertyName;

export interface SetupApplicationEventHandlersRuntimeScope {
    readonly getProcessArgumentValues: SetupApplicationEventHandlersRuntimeProvider<
        () => readonly string[]
    >;
    readonly getProcessEnvironmentValue: SetupApplicationEventHandlersRuntimeProvider<
        (name: string) => string | undefined
    >;
    readonly getProcessStringValue: SetupApplicationEventHandlersRuntimeProvider<
        (name: SetupApplicationEventHandlersProcessStringName) =>
            | string
            | undefined
    >;
    readonly isDevelopmentEnvironment: SetupApplicationEventHandlersRuntimeProvider<
        () => boolean
    >;
    readonly isTestEnvironment: SetupApplicationEventHandlersRuntimeProvider<
        () => boolean
    >;
}

export interface SetupApplicationEventHandlersRuntime {
    readonly getProcessArgumentValues: () => readonly string[];
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
    readonly getProcessStringValue: (
        name: SetupApplicationEventHandlersProcessStringName
    ) => string | undefined;
    readonly isDevelopmentEnvironment: () => boolean;
    readonly isTestEnvironment: () => boolean;
}

const defaultSetupApplicationEventHandlersRuntimeScope: SetupApplicationEventHandlersRuntimeScope =
    {
        getProcessArgumentValues: getRuntimeProcessArgumentValues,
        getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
        getProcessStringValue: getRuntimeProcessStringValue,
        isDevelopmentEnvironment: isRuntimeDevelopmentEnvironment,
        isTestEnvironment: isRuntimeTestEnvironment,
    };

function getRequiredProvider<T>(
    provider: SetupApplicationEventHandlersRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `setupApplicationEventHandlersRuntime requires ${providerName} provider`
    );
}

export function getSetupApplicationEventHandlersRuntime(
    scope: SetupApplicationEventHandlersRuntimeScope = defaultSetupApplicationEventHandlersRuntimeScope
): SetupApplicationEventHandlersRuntime {
    return {
        getProcessArgumentValues(): readonly string[] {
            return getRequiredProvider(
                scope.getProcessArgumentValues,
                "processArgumentValues"
            )();
        },
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
        isDevelopmentEnvironment(): boolean {
            return getRequiredProvider(
                scope.isDevelopmentEnvironment,
                "developmentEnvironment"
            )();
        },
        isTestEnvironment(): boolean {
            return getRequiredProvider(
                scope.isTestEnvironment,
                "testEnvironment"
            )();
        },
    };
}

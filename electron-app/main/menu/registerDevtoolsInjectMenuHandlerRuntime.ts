import {
    isDevelopmentEnvironment as isRuntimeDevelopmentEnvironment,
    isTestEnvironment as isRuntimeTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";

type RegisterDevtoolsInjectMenuHandlerRuntimeProvider<T> = T | undefined;

export interface RegisterDevtoolsInjectMenuHandlerRuntimeScope {
    readonly isDevelopmentEnvironment: RegisterDevtoolsInjectMenuHandlerRuntimeProvider<
        () => boolean
    >;
    readonly isTestEnvironment: RegisterDevtoolsInjectMenuHandlerRuntimeProvider<
        () => boolean
    >;
}

export interface RegisterDevtoolsInjectMenuHandlerRuntime {
    readonly isDevelopmentEnvironment: () => boolean;
    readonly isTestEnvironment: () => boolean;
}

const defaultRegisterDevtoolsInjectMenuHandlerRuntimeScope: RegisterDevtoolsInjectMenuHandlerRuntimeScope =
    {
        isDevelopmentEnvironment: isRuntimeDevelopmentEnvironment,
        isTestEnvironment: isRuntimeTestEnvironment,
    };

function getRequiredProvider<T>(
    provider: RegisterDevtoolsInjectMenuHandlerRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `registerDevtoolsInjectMenuHandlerRuntime requires ${providerName} provider`
    );
}

export function getRegisterDevtoolsInjectMenuHandlerRuntime(
    scope: RegisterDevtoolsInjectMenuHandlerRuntimeScope = defaultRegisterDevtoolsInjectMenuHandlerRuntimeScope
): RegisterDevtoolsInjectMenuHandlerRuntime {
    return {
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

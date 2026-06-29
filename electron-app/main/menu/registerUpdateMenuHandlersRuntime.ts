import {
    getProcessStringValue as getRuntimeProcessStringValue,
    type RuntimeProcessStringPropertyName,
} from "../../utils/runtime/processEnvironment.js";

type RegisterUpdateMenuHandlersRuntimeProvider<T> = T | undefined;
export type RegisterUpdateMenuHandlersProcessStringName =
    RuntimeProcessStringPropertyName;

export interface RegisterUpdateMenuHandlersRuntimeScope {
    readonly getProcessStringValue: RegisterUpdateMenuHandlersRuntimeProvider<
        (property: RegisterUpdateMenuHandlersProcessStringName) =>
            | string
            | undefined
    >;
}

export interface RegisterUpdateMenuHandlersRuntime {
    readonly getProcessStringValue: (
        property: RegisterUpdateMenuHandlersProcessStringName
    ) => string | undefined;
}

const defaultRegisterUpdateMenuHandlersRuntimeScope: RegisterUpdateMenuHandlersRuntimeScope =
    {
        getProcessStringValue: getRuntimeProcessStringValue,
    };

function getRequiredProvider<T>(
    provider: RegisterUpdateMenuHandlersRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `registerUpdateMenuHandlersRuntime requires ${providerName} provider`
    );
}

export function getRegisterUpdateMenuHandlersRuntime(
    scope: RegisterUpdateMenuHandlersRuntimeScope = defaultRegisterUpdateMenuHandlersRuntimeScope
): RegisterUpdateMenuHandlersRuntime {
    return {
        getProcessStringValue(property): string | undefined {
            return getRequiredProvider(
                scope.getProcessStringValue,
                "processStringValue"
            )(property);
        },
    };
}

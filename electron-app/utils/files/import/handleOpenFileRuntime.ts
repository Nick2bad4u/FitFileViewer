import { getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue } from "../../runtime/processEnvironment.js";

type HandleOpenFileRuntimeProvider<T> =
    | ((name: string) => T | undefined)
    | undefined;

export interface HandleOpenFileRuntimeScope {
    readonly getProcessEnvironmentValue: HandleOpenFileRuntimeProvider<string>;
}

export interface HandleOpenFileRuntime {
    readonly isNonProductionEnvironment: () => boolean;
}

const defaultHandleOpenFileRuntimeScope: HandleOpenFileRuntimeScope = {
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
};

function getRequiredProvider<T>(
    provider: HandleOpenFileRuntimeProvider<T>,
    providerName: string
): (name: string) => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `handleOpenFile requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

export function getHandleOpenFileRuntime(
    scope: HandleOpenFileRuntimeScope = defaultHandleOpenFileRuntimeScope
): HandleOpenFileRuntime {
    return {
        isNonProductionEnvironment(): boolean {
            const environment = getRequiredProvider(
                scope.getProcessEnvironmentValue,
                "process environment"
            )("NODE_ENV");

            return environment !== undefined && environment !== "production";
        },
    };
}

import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export type AppDomainStateDateNow = () => number;

export interface AppDomainStateRuntimeScope {
    readonly getDateNow: AppDomainStateRuntimeProvider<AppDomainStateDateNow>;
}

type AppDomainStateRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface AppDomainStateRuntime {
    readonly dateNow: () => number;
}

const defaultAppDomainStateRuntimeScope: AppDomainStateRuntimeScope = {
    getDateNow: getBrowserDateNow,
};

export function getAppDomainStateRuntime(
    scope: AppDomainStateRuntimeScope = defaultAppDomainStateRuntimeScope
): AppDomainStateRuntime {
    return {
        dateNow(): number {
            const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
            if (typeof dateNow !== "function") {
                throw new TypeError("appDomainState requires dateNow");
            }

            return dateNow();
        },
    };
}

function getRequiredProvider<T>(
    provider: AppDomainStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `appDomainState requires a ${providerName} provider`
        );
    }

    return provider;
}

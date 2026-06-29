import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export type AppDomainStateDateNow = () => number;

export interface AppDomainStateRuntimeScope {
    readonly getDateNow: () => AppDomainStateDateNow | undefined;
}

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
            if (typeof scope.getDateNow !== "function") {
                throw new TypeError(
                    "appDomainState requires a dateNow provider"
                );
            }

            const dateNow = scope.getDateNow();
            if (typeof dateNow !== "function") {
                throw new TypeError("appDomainState requires dateNow");
            }

            return dateNow();
        },
    };
}

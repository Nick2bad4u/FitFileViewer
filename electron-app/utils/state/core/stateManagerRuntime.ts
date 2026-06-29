import { getBrowserDateNow } from "../../runtime/browserRuntime.js";
import { isTestEnvironment as isRuntimeTestEnvironment } from "../../runtime/processEnvironment.js";

export interface StateManagerRuntimeScope {
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
    readonly getIsTestEnvironment: (() => (() => boolean) | undefined) | undefined;
}

export interface StateManagerRuntime {
    dateNow: () => number;
    isTestEnvironment: () => boolean;
}

const defaultStateManagerRuntimeScope: StateManagerRuntimeScope = {
    getDateNow: getBrowserDateNow,
    getIsTestEnvironment: () => isRuntimeTestEnvironment,
};

export function getStateManagerRuntime(
    scope: StateManagerRuntimeScope = defaultStateManagerRuntimeScope
): StateManagerRuntime {
    return {
        dateNow(): number {
            if (typeof scope.getDateNow !== "function") {
                throw new TypeError("stateManager requires a dateNow provider");
            }

            const dateNow = scope.getDateNow();
            if (typeof dateNow !== "function") {
                throw new TypeError("stateManager requires dateNow");
            }

            return dateNow();
        },
        isTestEnvironment(): boolean {
            if (typeof scope.getIsTestEnvironment !== "function") {
                throw new TypeError(
                    "stateManager requires an isTestEnvironment provider"
                );
            }

            const isTestEnvironment = scope.getIsTestEnvironment();
            if (typeof isTestEnvironment !== "function") {
                throw new TypeError(
                    "stateManager requires an isTestEnvironment runtime"
                );
            }

            return isTestEnvironment();
        },
    };
}

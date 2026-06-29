import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export interface StateManagerRuntimeScope {
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
}

export interface StateManagerRuntime {
    dateNow: () => number;
}

const defaultStateManagerRuntimeScope: StateManagerRuntimeScope = {
    getDateNow: getBrowserDateNow,
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
    };
}

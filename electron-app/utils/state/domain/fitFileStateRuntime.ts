import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export type FitFileStateDateNow = () => number;

export interface FitFileStateRuntimeScope {
    readonly getDateNow: () => FitFileStateDateNow | undefined;
}

export interface FitFileStateRuntime {
    readonly dateNow: () => number;
}

const defaultFitFileStateRuntimeScope: FitFileStateRuntimeScope = {
    getDateNow: getBrowserDateNow,
};

export function getFitFileStateRuntime(
    scope: FitFileStateRuntimeScope = defaultFitFileStateRuntimeScope
): FitFileStateRuntime {
    return {
        dateNow(): number {
            if (typeof scope.getDateNow !== "function") {
                throw new TypeError("fitFileState requires a dateNow provider");
            }

            const dateNow = scope.getDateNow();
            if (typeof dateNow !== "function") {
                throw new TypeError("fitFileState requires dateNow");
            }

            return dateNow();
        },
    };
}

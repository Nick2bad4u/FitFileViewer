import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export type FitFileStateDateNow = () => number;

export interface FitFileStateRuntimeScope {
    readonly getDateNow: FitFileStateRuntimeProvider<FitFileStateDateNow>;
}

type FitFileStateRuntimeProvider<T> = (() => T | undefined) | undefined;

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
            const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
            if (typeof dateNow !== "function") {
                throw new TypeError("fitFileState requires dateNow");
            }

            return dateNow();
        },
    };
}

function getRequiredProvider<T>(
    provider: FitFileStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`fitFileState requires a ${providerName} provider`);
    }

    return provider;
}

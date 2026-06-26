import { getBrowserDateNow } from "./utils/runtime/browserRuntime.js";

type FitParserDateConstructor = new () => { toISOString: () => string };

export interface FitParserRuntimeScope {
    readonly getDateConstructor?:
        | (() => FitParserDateConstructor | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
}

export interface FitParserRuntime {
    dateNow: () => number;
    isoTimestamp: () => string;
}

const defaultFitParserRuntimeScope: FitParserRuntimeScope = {
    getDateConstructor: () => Date,
    getDateNow: getBrowserDateNow,
};

function getRequiredDateConstructor(
    scope: FitParserRuntimeScope
): FitParserDateConstructor {
    const DateConstructor = scope.getDateConstructor?.();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("fitParserRuntime requires a date constructor");
}

function getRequiredDateNow(scope: FitParserRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("fitParserRuntime requires a date clock");
}

export function getFitParserRuntime(
    scope: FitParserRuntimeScope = defaultFitParserRuntimeScope
): FitParserRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        isoTimestamp(): string {
            const DateConstructor = getRequiredDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}

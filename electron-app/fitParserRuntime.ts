import { getBrowserDateNow } from "./utils/runtime/browserRuntime.js";

type FitParserDateConstructor = new () => { toISOString: () => string };

export interface FitParserRuntimeScope {
    readonly getDateConstructor: FitParserRuntimeProvider<FitParserDateConstructor>;
    readonly getDateNow: FitParserRuntimeProvider<() => number>;
}

type FitParserRuntimeProvider<T> = (() => T | undefined) | undefined;

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
    const DateConstructor = getRequiredProvider(
        scope.getDateConstructor,
        "date constructor"
    )();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("fitParserRuntime requires a date constructor");
}

function getRequiredDateNow(scope: FitParserRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "date clock")();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("fitParserRuntime requires a date clock");
}

function getRequiredProvider<T>(
    provider: FitParserRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `fitParserRuntime requires a ${providerName} provider`
        );
    }

    return provider;
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

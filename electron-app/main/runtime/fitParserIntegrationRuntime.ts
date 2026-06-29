import {
    getBrowserDateNow,
    getBrowserPerformance,
} from "../../utils/runtime/browserRuntime.js";

type FitParserIntegrationPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

type FitParserIntegrationRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface FitParserIntegrationRuntimeScope {
    readonly getDateNow: FitParserIntegrationRuntimeProvider<() => number>;
    readonly getPerformance: FitParserIntegrationRuntimeProvider<FitParserIntegrationPerformanceRuntime>;
}

export interface FitParserIntegrationRuntime {
    dateNow: () => number;
    monotonicNowMs: () => number;
}

const defaultFitParserIntegrationRuntimeScope: FitParserIntegrationRuntimeScope =
    {
        getDateNow: getBrowserDateNow,
        getPerformance: getBrowserPerformance,
    };

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("fitParserIntegrationRuntime requires a date clock");
}

function getRequiredMonotonicNow(
    getDateNow: () => (() => number) | undefined,
    getPerformance: () => FitParserIntegrationPerformanceRuntime | undefined
): () => number {
    const performance = getPerformance();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    return getRequiredDateNow(getDateNow);
}

export function getFitParserIntegrationRuntime(
    scope: FitParserIntegrationRuntimeScope = defaultFitParserIntegrationRuntimeScope
): FitParserIntegrationRuntime {
    const getDateNow = getRequiredProvider(scope.getDateNow, "date clock");
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );

    return {
        dateNow(): number {
            return getRequiredDateNow(getDateNow)();
        },
        monotonicNowMs(): number {
            return getRequiredMonotonicNow(getDateNow, getPerformance)();
        },
    };
}

function getRequiredProvider<T>(
    provider: FitParserIntegrationRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `fitParserIntegrationRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

type FitParserIntegrationPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface FitParserIntegrationRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformance?:
        | (() => FitParserIntegrationPerformanceRuntime | undefined)
        | undefined;
}

export interface FitParserIntegrationRuntime {
    dateNow: () => number;
    monotonicNowMs: () => number;
}

const defaultFitParserIntegrationRuntimeScope: FitParserIntegrationRuntimeScope =
    {
        getDateNow: () => Date.now,
        getPerformance: () => globalThis.performance,
    };

function getRequiredDateNow(
    scope: FitParserIntegrationRuntimeScope
): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("fitParserIntegrationRuntime requires a date clock");
}

function getRequiredMonotonicNow(
    scope: FitParserIntegrationRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    return getRequiredDateNow(scope);
}

export function getFitParserIntegrationRuntime(
    scope: FitParserIntegrationRuntimeScope = defaultFitParserIntegrationRuntimeScope
): FitParserIntegrationRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        monotonicNowMs(): number {
            return getRequiredMonotonicNow(scope)();
        },
    };
}

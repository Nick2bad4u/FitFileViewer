type GlobalChartStatusLogDateConstructor = new () => {
    toISOString: () => string;
};

export interface GlobalChartStatusLogRuntimeScope {
    readonly getDateConstructor: GlobalChartStatusLogRuntimeProvider<GlobalChartStatusLogDateConstructor>;
}

export interface GlobalChartStatusLogRuntime {
    isoNow: () => string;
}

type GlobalChartStatusLogRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultGlobalChartStatusLogRuntimeScope: GlobalChartStatusLogRuntimeScope =
    {
        getDateConstructor: () => Date,
    };

function getRequiredDateConstructor(
    getDateConstructor: () => GlobalChartStatusLogDateConstructor | undefined
): GlobalChartStatusLogDateConstructor {
    const DateConstructor = getDateConstructor();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError(
        "globalChartStatusLogRuntime requires a date constructor"
    );
}

export function globalChartStatusLogRuntime(
    scope: GlobalChartStatusLogRuntimeScope = defaultGlobalChartStatusLogRuntimeScope
): GlobalChartStatusLogRuntime {
    const getDateConstructor = getRequiredProvider(
        scope.getDateConstructor,
        "date constructor"
    );

    return {
        isoNow(): string {
            const DateConstructor =
                getRequiredDateConstructor(getDateConstructor);
            return new DateConstructor().toISOString();
        },
    };
}

function getRequiredProvider<T>(
    provider: GlobalChartStatusLogRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `globalChartStatusLogRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}

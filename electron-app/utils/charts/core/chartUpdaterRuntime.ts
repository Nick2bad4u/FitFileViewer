type ChartUpdaterDateConstructor = new () => { toISOString: () => string };

export interface ChartUpdaterRuntimeScope {
    readonly getDateConstructor: ChartUpdaterRuntimeProvider<ChartUpdaterDateConstructor>;
}

export interface ChartUpdaterRuntime {
    isoNow: () => string;
}

type ChartUpdaterRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultChartUpdaterRuntimeScope: ChartUpdaterRuntimeScope = {
    getDateConstructor: () => Date,
};

function getRequiredDateConstructor(
    getDateConstructor: () => ChartUpdaterDateConstructor | undefined
): ChartUpdaterDateConstructor {
    const DateConstructor = getDateConstructor();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("chartUpdaterRuntime requires a date constructor");
}

export function chartUpdaterRuntime(
    scope: ChartUpdaterRuntimeScope = defaultChartUpdaterRuntimeScope
): ChartUpdaterRuntime {
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
    provider: ChartUpdaterRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `chartUpdaterRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}

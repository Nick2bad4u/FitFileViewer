type ChartUpdaterDateConstructor = new () => { toISOString: () => string };

export interface ChartUpdaterRuntimeScope {
    readonly getDateConstructor: () => ChartUpdaterDateConstructor | undefined;
}

export interface ChartUpdaterRuntime {
    isoNow: () => string;
}

const defaultChartUpdaterRuntimeScope: ChartUpdaterRuntimeScope = {
    getDateConstructor: () => Date,
};

function getRequiredDateConstructor(
    scope: ChartUpdaterRuntimeScope
): ChartUpdaterDateConstructor {
    if (typeof scope.getDateConstructor !== "function") {
        throw new TypeError(
            "chartUpdaterRuntime requires a date constructor provider"
        );
    }

    const DateConstructor = scope.getDateConstructor();
    if (typeof DateConstructor === "function") {
        return DateConstructor;
    }

    throw new TypeError("chartUpdaterRuntime requires a date constructor");
}

export function chartUpdaterRuntime(
    scope: ChartUpdaterRuntimeScope = defaultChartUpdaterRuntimeScope
): ChartUpdaterRuntime {
    return {
        isoNow(): string {
            const DateConstructor = getRequiredDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}

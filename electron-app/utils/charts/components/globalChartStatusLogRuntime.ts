type GlobalChartStatusLogDateConstructor = new () => {
    toISOString: () => string;
};

export interface GlobalChartStatusLogRuntimeScope {
    readonly getDateConstructor?:
        | (() => GlobalChartStatusLogDateConstructor | undefined)
        | undefined;
}

export interface GlobalChartStatusLogRuntime {
    isoNow: () => string;
}

const defaultGlobalChartStatusLogRuntimeScope: GlobalChartStatusLogRuntimeScope =
    {
        getDateConstructor: () => Date,
    };

function getRequiredDateConstructor(
    scope: GlobalChartStatusLogRuntimeScope
): GlobalChartStatusLogDateConstructor {
    const DateConstructor = scope.getDateConstructor?.();
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
    return {
        isoNow(): string {
            const DateConstructor = getRequiredDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}

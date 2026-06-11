export interface ChartStatusIndicatorRuntimeScope {
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
}

export interface ChartStatusIndicatorViewport {
    readonly height: number;
    readonly width: number;
}

export interface ChartStatusIndicatorRuntime {
    getViewport(): ChartStatusIndicatorViewport;
}

export function getChartStatusIndicatorRuntime(
    scope: ChartStatusIndicatorRuntimeScope = globalThis
): ChartStatusIndicatorRuntime {
    return {
        getViewport(): ChartStatusIndicatorViewport {
            return {
                height: scope.innerHeight ?? 0,
                width: scope.innerWidth ?? 0,
            };
        },
    };
}

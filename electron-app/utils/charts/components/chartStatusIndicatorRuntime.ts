export interface ChartStatusIndicatorRuntimeScope {
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
}

export interface ChartStatusIndicatorViewport {
    readonly height: number;
    readonly width: number;
}

export interface ChartStatusIndicatorRuntime {
    addFieldToggleChangedListener(
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    getViewport(): ChartStatusIndicatorViewport;
}

export function getChartStatusIndicatorRuntime(
    scope: ChartStatusIndicatorRuntimeScope = globalThis
): ChartStatusIndicatorRuntime {
    return {
        addFieldToggleChangedListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            scope.addEventListener?.("fieldToggleChanged", listener, {
                ...options,
                signal: options.signal,
            });
        },
        getViewport(): ChartStatusIndicatorViewport {
            return {
                height: scope.innerHeight ?? 0,
                width: scope.innerWidth ?? 0,
            };
        },
    };
}

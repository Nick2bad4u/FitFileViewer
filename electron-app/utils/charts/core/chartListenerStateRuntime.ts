export interface ChartListenerStateRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface ChartListenerStateRuntime {
    createAbortController: () => AbortController;
}

const defaultChartListenerStateRuntimeScope: ChartListenerStateRuntimeScope =
    globalThis;

function getAbortControllerConstructor(
    scope: ChartListenerStateRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartListenerState requires an AbortController");
    }

    return AbortControllerConstructor;
}

export function getChartListenerStateRuntime(
    scope: ChartListenerStateRuntimeScope = defaultChartListenerStateRuntimeScope
): ChartListenerStateRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

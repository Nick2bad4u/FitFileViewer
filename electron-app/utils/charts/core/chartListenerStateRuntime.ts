import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export interface ChartListenerStateRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface ChartListenerStateRuntime {
    createAbortController: () => AbortController;
}

const defaultChartListenerStateRuntimeScope: ChartListenerStateRuntimeScope = {
    getAbortController: getBrowserAbortController,
};

function getAbortControllerConstructor(
    scope: ChartListenerStateRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
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

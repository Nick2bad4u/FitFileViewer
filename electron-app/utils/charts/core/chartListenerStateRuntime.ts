import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../../runtime/browserRuntime.js";

export interface ChartListenerStateRuntimeScope {
    readonly getAbortController: () =>
        | BrowserAbortControllerConstructor
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
): BrowserAbortControllerConstructor {
    if (typeof scope.getAbortController !== "function") {
        throw new TypeError(
            "chartListenerState requires an AbortController provider"
        );
    }

    const AbortControllerConstructor = scope.getAbortController();
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

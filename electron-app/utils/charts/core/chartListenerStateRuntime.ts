import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../../runtime/browserRuntime.js";

export interface ChartListenerStateRuntimeScope {
    readonly getAbortController: ChartListenerStateRuntimeProvider<BrowserAbortControllerConstructor>;
}

export interface ChartListenerStateRuntime {
    createAbortController: () => AbortController;
}

type ChartListenerStateRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultChartListenerStateRuntimeScope: ChartListenerStateRuntimeScope = {
    getAbortController: getBrowserAbortController,
};

function getAbortControllerConstructor(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getAbortController();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartListenerState requires an AbortController");
    }

    return AbortControllerConstructor;
}

export function getChartListenerStateRuntime(
    scope: ChartListenerStateRuntimeScope = defaultChartListenerStateRuntimeScope
): ChartListenerStateRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );

    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(getAbortController))();
        },
    };
}

function getRequiredProvider<T>(
    provider: ChartListenerStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `chartListenerState requires an ${providerName} provider`
        );
    }

    return provider;
}

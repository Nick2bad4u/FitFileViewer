export interface LoadSingleOverlayFileRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface LoadSingleOverlayFileRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultLoadSingleOverlayFileRuntimeScope: LoadSingleOverlayFileRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
    };

export function getLoadSingleOverlayFileRuntime(
    scope: LoadSingleOverlayFileRuntimeScope = defaultLoadSingleOverlayFileRuntimeScope
): LoadSingleOverlayFileRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

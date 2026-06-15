export interface LoadSingleOverlayFileRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface LoadSingleOverlayFileRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultLoadSingleOverlayFileRuntimeScope: LoadSingleOverlayFileRuntimeScope =
    globalThis;

export function getLoadSingleOverlayFileRuntime(
    scope: LoadSingleOverlayFileRuntimeScope = defaultLoadSingleOverlayFileRuntimeScope
): LoadSingleOverlayFileRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

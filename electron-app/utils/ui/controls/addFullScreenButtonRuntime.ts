export interface AddFullScreenButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface AddFullScreenButtonRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getAddFullScreenButtonRuntime(
    scope: AddFullScreenButtonRuntimeScope = globalThis
): AddFullScreenButtonRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

export interface ErrorHandlingRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: ErrorHandlingRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "errorHandling requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getErrorHandlingRuntime(
    scope: ErrorHandlingRuntimeScope = globalThis
): ErrorHandlingRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

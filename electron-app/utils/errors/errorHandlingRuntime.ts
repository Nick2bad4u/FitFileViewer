export interface ErrorHandlingRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
}

const defaultErrorHandlingRuntimeScope: ErrorHandlingRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
};

function getAbortControllerConstructor(
    scope: ErrorHandlingRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ?? scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "errorHandling requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getErrorHandlingRuntime(
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

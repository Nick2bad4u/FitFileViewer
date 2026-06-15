export interface ErrorHandlingRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
}

const defaultErrorHandlingRuntimeScope: ErrorHandlingRuntimeScope = {
    get AbortController() {
        return globalThis.AbortController;
    },
};

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
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

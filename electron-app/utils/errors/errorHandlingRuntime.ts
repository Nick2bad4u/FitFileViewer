export interface ErrorHandlingRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => Window["addEventListener"] | undefined)
        | undefined;
    readonly getEventTarget?:
        | (() => ErrorHandlingEventTarget | undefined)
        | undefined;
}

export interface ErrorHandlingEventTarget {
    readonly addEventListener: Window["addEventListener"];
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
    getGlobalEventTarget: () => ErrorHandlingEventTarget | undefined;
}

const defaultErrorHandlingRuntimeScope: ErrorHandlingRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getAddEventListener: () => globalThis.addEventListener,
    getEventTarget: getDefaultEventTarget,
};

function getDefaultEventTarget(
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingEventTarget | undefined {
    const addEventListener = scope.getAddEventListener?.();
    if (typeof addEventListener !== "function") {
        return undefined;
    }

    return {
        addEventListener: addEventListener.bind(globalThis),
    };
}

function getAbortControllerConstructor(
    scope: ErrorHandlingRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "errorHandling requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getEventTarget(
    scope: ErrorHandlingRuntimeScope
): ErrorHandlingEventTarget | undefined {
    return scope.getEventTarget?.() ?? getDefaultEventTarget(scope);
}

export function getErrorHandlingRuntime(
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        getGlobalEventTarget(): ErrorHandlingEventTarget | undefined {
            return getEventTarget(scope);
        },
    };
}

export interface ErrorHandlingRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
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
    getAbortController: getDefaultAbortController,
    getEventTarget: getDefaultEventTarget,
};

function getDefaultAbortController(): typeof AbortController | undefined {
    const AbortControllerConstructor = globalThis.AbortController;

    return typeof AbortControllerConstructor === "function"
        ? AbortControllerConstructor
        : undefined;
}

function getDefaultEventTarget(): ErrorHandlingEventTarget | undefined {
    const addEventListener = globalThis.addEventListener;
    if (typeof addEventListener !== "function") {
        return undefined;
    }

    return {
        addEventListener: addEventListener.bind(
            globalThis
        ) as ErrorHandlingEventTarget["addEventListener"],
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
    return scope.getEventTarget?.();
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

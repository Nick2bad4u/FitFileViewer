import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserDateNow,
} from "../runtime/browserRuntime.js";

export interface ErrorHandlingRuntimeScope {
    readonly getAbortController: () =>
        | BrowserAbortControllerConstructor
        | undefined;
    readonly getAddEventListener: () => BrowserAddEventListener | undefined;
    readonly getDateConstructor: () => ErrorHandlingDateConstructor | undefined;
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
    readonly getErrorListenerTarget: () => ErrorHandlingEventTarget | undefined;
}

type ErrorHandlingDateConstructor = new () => { toISOString: () => string };

export interface ErrorHandlingEventTarget {
    readonly addEventListener: BrowserAddEventListener;
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
    dateNow: () => number;
    getErrorListenerTarget: () => ErrorHandlingEventTarget | undefined;
    isoNow: () => string;
}

const defaultErrorHandlingRuntimeScope: ErrorHandlingRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getAddEventListener: getBrowserAddEventListener,
    getDateConstructor: () => Date,
    getDateNow: getBrowserDateNow,
    getErrorListenerTarget: getDefaultErrorListenerTarget,
};

function getDefaultErrorListenerTarget(
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingEventTarget | undefined {
    if (typeof scope.getAddEventListener !== "function") {
        throw new TypeError("errorHandling requires addEventListener provider");
    }

    const addEventListener = scope.getAddEventListener();
    if (typeof addEventListener !== "function") {
        return undefined;
    }

    return {
        addEventListener,
    };
}

function getAbortControllerConstructor(
    scope: ErrorHandlingRuntimeScope
): BrowserAbortControllerConstructor {
    if (typeof scope.getAbortController !== "function") {
        throw new TypeError("errorHandling requires AbortController provider");
    }

    const AbortControllerConstructor = scope.getAbortController();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "errorHandling requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDateNow(scope: ErrorHandlingRuntimeScope): () => number {
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError("errorHandling requires dateNow provider");
    }

    const dateNow = scope.getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("errorHandling requires dateNow");
    }

    return dateNow;
}

function getDateConstructor(
    scope: ErrorHandlingRuntimeScope
): ErrorHandlingDateConstructor {
    if (typeof scope.getDateConstructor !== "function") {
        throw new TypeError(
            "errorHandling requires a date constructor provider"
        );
    }

    const DateConstructor = scope.getDateConstructor();
    if (typeof DateConstructor !== "function") {
        throw new TypeError("errorHandling requires a date constructor");
    }

    return DateConstructor;
}

function getErrorListenerTarget(
    scope: ErrorHandlingRuntimeScope
): ErrorHandlingEventTarget | undefined {
    if (typeof scope.getErrorListenerTarget !== "function") {
        throw new TypeError("errorHandling requires error listener provider");
    }

    return (
        scope.getErrorListenerTarget() ?? getDefaultErrorListenerTarget(scope)
    );
}

export function getErrorHandlingRuntime(
    scope: ErrorHandlingRuntimeScope = defaultErrorHandlingRuntimeScope
): ErrorHandlingRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        dateNow(): number {
            return getDateNow(scope)();
        },
        getErrorListenerTarget(): ErrorHandlingEventTarget | undefined {
            return getErrorListenerTarget(scope);
        },
        isoNow(): string {
            const DateConstructor = getDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}

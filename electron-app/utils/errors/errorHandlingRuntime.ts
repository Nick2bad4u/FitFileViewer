import {
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserDateNow,
} from "../runtime/browserRuntime.js";

export interface ErrorHandlingRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => Window["addEventListener"] | undefined)
        | undefined;
    readonly getDateConstructor?:
        | (() => ErrorHandlingDateConstructor | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getEventTarget?:
        | (() => ErrorHandlingEventTarget | undefined)
        | undefined;
}

type ErrorHandlingDateConstructor = new () => { toISOString: () => string };

export interface ErrorHandlingEventTarget {
    readonly addEventListener: Window["addEventListener"];
}

export interface ErrorHandlingRuntime {
    createAbortController: () => AbortController;
    dateNow: () => number;
    getGlobalEventTarget: () => ErrorHandlingEventTarget | undefined;
    isoNow: () => string;
}

const defaultErrorHandlingRuntimeScope: ErrorHandlingRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getAddEventListener: getBrowserAddEventListener,
    getDateConstructor: () => Date,
    getDateNow: getBrowserDateNow,
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

function getDateNow(scope: ErrorHandlingRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("errorHandling requires dateNow");
    }

    return dateNow;
}

function getDateConstructor(
    scope: ErrorHandlingRuntimeScope
): ErrorHandlingDateConstructor {
    const DateConstructor = scope.getDateConstructor?.();
    if (typeof DateConstructor !== "function") {
        throw new TypeError("errorHandling requires a date constructor");
    }

    return DateConstructor;
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
        dateNow(): number {
            return getDateNow(scope)();
        },
        getGlobalEventTarget(): ErrorHandlingEventTarget | undefined {
            return getEventTarget(scope);
        },
        isoNow(): string {
            const DateConstructor = getDateConstructor(scope);
            return new DateConstructor().toISOString();
        },
    };
}

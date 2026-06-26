import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserQueueMicrotask,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserNavigator,
    getBrowserQueueMicrotask,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type OpenFileSelectorTimer = BrowserTimerHandle;

export interface OpenFileSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getNavigator?:
        | (() => Pick<Navigator, "userAgent"> | undefined)
        | undefined;
    readonly getQueueMicrotask?:
        | (() => BrowserQueueMicrotask | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
        | undefined;
}

export interface OpenFileSelectorRuntime {
    appendToBody: (element: Readonly<HTMLElement>) => void;
    clearTimeout: (timer: OpenFileSelectorTimer) => void;
    createAbortController: () => AbortController;
    createInput: () => HTMLInputElement;
    isJsdom: () => boolean;
    queueMicrotask: (callback: () => void) => void;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => OpenFileSelectorTimer;
}

function getDocument(scope: OpenFileSelectorRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("openFileSelector requires a document runtime");
    }

    return runtimeDocument;
}

function getAbortController(
    scope: OpenFileSelectorRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getRequiredClearTimeout(
    scope: OpenFileSelectorRuntimeScope
): BrowserClearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getNavigator(
    scope: OpenFileSelectorRuntimeScope
): Pick<Navigator, "userAgent"> | undefined {
    return scope.getNavigator?.();
}

function getRequiredQueueMicrotask(
    scope: OpenFileSelectorRuntimeScope
): BrowserQueueMicrotask {
    const queueMicrotaskRef = scope.getQueueMicrotask?.();
    if (typeof queueMicrotaskRef !== "function") {
        throw new TypeError(
            "openFileSelector requires a queueMicrotask runtime"
        );
    }

    return queueMicrotaskRef;
}

function getRequiredSetTimeout(
    scope: OpenFileSelectorRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultOpenFileSelectorRuntimeScope: OpenFileSelectorRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getNavigator: getBrowserNavigator,
    getQueueMicrotask: getBrowserQueueMicrotask,
    getSetTimeout: getBrowserSetTimeout,
};

export function getOpenFileSelectorRuntime(
    scope: OpenFileSelectorRuntimeScope = defaultOpenFileSelectorRuntimeScope
): OpenFileSelectorRuntime {
    return {
        appendToBody(element): void {
            getDocument(scope).body.append(element);
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "openFileSelector requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createInput(): HTMLInputElement {
            return getDocument(scope).createElement("input");
        },
        isJsdom(): boolean {
            return /jsdom/iu.test(getNavigator(scope)?.userAgent ?? "");
        },
        queueMicrotask(callback): void {
            const queueMicrotaskRef = getRequiredQueueMicrotask(scope);
            queueMicrotaskRef(callback);
        },
        setTimeout(callback, delayMs): OpenFileSelectorTimer {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, delayMs);
        },
    };
}

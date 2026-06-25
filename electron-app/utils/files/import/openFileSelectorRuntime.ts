import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export type OpenFileSelectorTimer = ReturnType<typeof globalThis.setTimeout>;

export interface OpenFileSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getNavigator?:
        | (() => Pick<Navigator, "userAgent"> | undefined)
        | undefined;
    readonly getQueueMicrotask?:
        | (() => typeof globalThis.queueMicrotask | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
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
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getRequiredClearTimeout(
    scope: OpenFileSelectorRuntimeScope
): typeof globalThis.clearTimeout {
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
): typeof globalThis.queueMicrotask {
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
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultOpenFileSelectorRuntimeScope: OpenFileSelectorRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getNavigator: () => globalThis.navigator,
    getQueueMicrotask: () => globalThis.queueMicrotask,
    getSetTimeout: () => globalThis.setTimeout,
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

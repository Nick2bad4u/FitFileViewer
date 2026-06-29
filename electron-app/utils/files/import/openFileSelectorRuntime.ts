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
    readonly getAbortController: OpenFileSelectorRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: OpenFileSelectorRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: OpenFileSelectorRuntimeProvider<Document>;
    readonly getNavigator: OpenFileSelectorRuntimeProvider<
        Pick<Navigator, "userAgent">
    >;
    readonly getQueueMicrotask: OpenFileSelectorRuntimeProvider<BrowserQueueMicrotask>;
    readonly getSetTimeout: OpenFileSelectorRuntimeProvider<BrowserSetTimeout>;
}

type OpenFileSelectorRuntimeProvider<T> = (() => T | undefined) | undefined;

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

function getRequiredProvider<T>(
    provider: OpenFileSelectorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `openFileSelector requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getDocument(scope: OpenFileSelectorRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("openFileSelector requires a document runtime");
    }

    return runtimeDocument;
}

function getAbortController(
    scope: OpenFileSelectorRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getRequiredClearTimeout(
    scope: OpenFileSelectorRuntimeScope
): BrowserClearTimeout {
    const clearTimeoutRef = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    )();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getNavigator(
    scope: OpenFileSelectorRuntimeScope
): Pick<Navigator, "userAgent"> | undefined {
    return getRequiredProvider(scope.getNavigator, "navigator")();
}

function getRequiredQueueMicrotask(
    scope: OpenFileSelectorRuntimeScope
): BrowserQueueMicrotask {
    const queueMicrotaskRef = getRequiredProvider(
        scope.getQueueMicrotask,
        "queueMicrotask"
    )();
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
    const setTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
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

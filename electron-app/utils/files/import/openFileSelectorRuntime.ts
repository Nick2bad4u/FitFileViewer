export type OpenFileSelectorTimer = ReturnType<typeof globalThis.setTimeout>;

export interface OpenFileSelectorRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly navigator?: Pick<Navigator, "userAgent"> | undefined;
    readonly queueMicrotask?: typeof globalThis.queueMicrotask | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface OpenFileSelectorRuntime {
    appendToBody: (element: HTMLElement) => void;
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
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("openFileSelector requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredClearTimeout(
    scope: OpenFileSelectorRuntimeScope
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getRequiredQueueMicrotask(
    scope: OpenFileSelectorRuntimeScope
): typeof globalThis.queueMicrotask {
    const queueMicrotaskRef = scope.queueMicrotask;
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
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("openFileSelector requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

export function getOpenFileSelectorRuntime(
    scope: OpenFileSelectorRuntimeScope = globalThis
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
            const AbortControllerConstructor = scope.AbortController;
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
            return /jsdom/iu.test(scope.navigator?.userAgent ?? "");
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

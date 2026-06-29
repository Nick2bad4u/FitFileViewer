import {
    type BrowserAbortControllerConstructor,
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type TabStateManagerHandlersTimerHandle = BrowserTimerHandle;

type TabStateManagerHandlersRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface TabStateManagerHandlersRuntimeScope {
    readonly getAbortController: TabStateManagerHandlersRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getCancelAnimationFrame: TabStateManagerHandlersRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: TabStateManagerHandlersRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: TabStateManagerHandlersRuntimeProvider<Document>;
    readonly getRequestAnimationFrame: TabStateManagerHandlersRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: TabStateManagerHandlersRuntimeProvider<BrowserSetTimeout>;
}

export interface TabStateManagerHandlersRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: TabStateManagerHandlersTimerHandle) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createTextNode: (data: string) => Text;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => TabStateManagerHandlersTimerHandle;
}

const defaultTabStateManagerHandlersRuntimeScope: TabStateManagerHandlersRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getCancelAnimationFrame: getBrowserCancelAnimationFrame,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getRequestAnimationFrame: getBrowserRequestAnimationFrame,
        getSetTimeout: getBrowserSetTimeout,
    };

function getRequiredProvider<T>(
    provider: TabStateManagerHandlersRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOU]/u.test(providerName) ? "an" : "a";
        throw new TypeError(
            `tabStateManagerHandlers requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredDocument(
    scope: TabStateManagerHandlersRuntimeScope
): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "tabStateManagerHandlers requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getTabStateManagerHandlersRuntime(
    scope: TabStateManagerHandlersRuntimeScope = defaultTabStateManagerHandlersRuntimeScope
): TabStateManagerHandlersRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getRequiredProvider(
                scope.getCancelAnimationFrame,
                "cancelAnimationFrame"
            )()?.(handle);
        },
        clearTimeout(handle: TabStateManagerHandlersTimerHandle): void {
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getRequiredProvider(
                scope.getAbortController,
                "AbortController"
            )();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires an AbortController runtime"
                );
            }
            return new AbortControllerConstructor();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createTextNode(data: string): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrameRef = getRequiredProvider(
                scope.getRequestAnimationFrame,
                "requestAnimationFrame"
            )();
            if (typeof requestAnimationFrameRef !== "function") {
                return undefined;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): TabStateManagerHandlersTimerHandle {
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, delay);
        },
    };
}

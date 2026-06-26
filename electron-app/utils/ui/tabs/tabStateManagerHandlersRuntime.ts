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

export interface TabStateManagerHandlersRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => BrowserCancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
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

function getRequiredDocument(
    scope: TabStateManagerHandlersRuntimeScope
): Document {
    const runtimeDocument = scope.getDocument?.();
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
            scope.getCancelAnimationFrame?.()?.(handle);
        },
        clearTimeout(handle: TabStateManagerHandlersTimerHandle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
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
            const requestAnimationFrameRef = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrameRef !== "function") {
                return undefined;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): TabStateManagerHandlersTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, delay);
        },
    };
}

import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserEventConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserEvent,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type RenderMapTimer = BrowserTimerHandle;

export interface RenderMapRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEvent?: (() => BrowserEventConstructor | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface RenderMapRuntime {
    readonly clearTimeout: (timer: RenderMapTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createChangeEvent: () => Event;
    readonly getMapContainerFallback: (selector: string) => HTMLElement;
    readonly requestAnimationFrame: (
        frameCallback: FrameRequestCallback
    ) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => RenderMapTimer;
}

function getScopeAbortController(
    scope: RenderMapRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getRequiredClearTimeout(
    scope: RenderMapRuntimeScope
): BrowserClearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderMap requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getRequiredDocument(scope: RenderMapRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("renderMap requires a document runtime");
    }

    return documentRef;
}

function getRequiredEvent(
    scope: RenderMapRuntimeScope
): BrowserEventConstructor {
    const EventConstructor = scope.getEvent?.();
    if (typeof EventConstructor !== "function") {
        throw new TypeError("renderMap requires an Event runtime");
    }

    return EventConstructor;
}

function getScopeRequestAnimationFrame(
    scope: RenderMapRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getRequiredSetTimeout(
    scope: RenderMapRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("renderMap requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultRenderMapRuntimeScope: RenderMapRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getEvent: getBrowserEvent,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

export function getRenderMapRuntime(
    scope: RenderMapRuntimeScope = defaultRenderMapRuntimeScope
): RenderMapRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef.call(scope, timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderMap requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createChangeEvent(): Event {
            return new (getRequiredEvent(scope))("change");
        },
        getMapContainerFallback(selector): HTMLElement {
            const documentRef = getRequiredDocument(scope);
            return (
                documentRef.querySelector<HTMLElement>(selector) ??
                documentRef.body
            );
        },
        requestAnimationFrame(frameCallback): void {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef === "function") {
                requestAnimationFrameRef.call(scope, frameCallback);
                return;
            }

            const setTimeoutRef = getRequiredSetTimeout(scope);
            setTimeoutRef.call(scope, () => frameCallback(0), 0);
        },
        setTimeout(callback, delayMs): RenderMapTimer {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef.call(scope, callback, delayMs);
        },
    };
}

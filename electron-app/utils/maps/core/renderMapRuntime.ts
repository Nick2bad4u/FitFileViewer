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
import { querySelectorByIdFlexible as querySelectorByIdFlexibleFromDocument } from "../../ui/dom/elementIdUtils.js";

export type RenderMapTimer = BrowserTimerHandle;

export interface RenderMapRuntimeScope {
    readonly getAbortController: RenderMapRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: RenderMapRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: RenderMapRuntimeProvider<Document>;
    readonly getEvent: RenderMapRuntimeProvider<BrowserEventConstructor>;
    readonly getRequestAnimationFrame: RenderMapRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: RenderMapRuntimeProvider<BrowserSetTimeout>;
}

export interface RenderMapRuntime {
    readonly clearTimeout: (timer: RenderMapTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createChangeEvent: () => Event;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly getMapContainerFallback: (selector: string) => HTMLElement;
    readonly querySelector: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly querySelectorAll: <TElement extends Element = Element>(
        selector: string
    ) => NodeListOf<TElement>;
    readonly querySelectorByIdFlexible: (
        selector: string
    ) => HTMLElement | null;
    readonly requestAnimationFrame: (
        frameCallback: FrameRequestCallback
    ) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => RenderMapTimer;
}

type RenderMapRuntimeProvider<T> = (() => T | undefined) | undefined;

function getScopeAbortController(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor | undefined {
    return getAbortController();
}

function getRequiredClearTimeout(
    getClearTimeout: () => BrowserClearTimeout | undefined
): BrowserClearTimeout {
    const clearTimeoutRef = getClearTimeout();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderMap requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getRequiredDocument(
    getDocument: () => Document | undefined
): Document {
    const documentRef = getDocument();
    if (!documentRef) {
        throw new TypeError("renderMap requires a document runtime");
    }

    return documentRef;
}

function getRequiredEvent(
    getEvent: () => BrowserEventConstructor | undefined
): BrowserEventConstructor {
    const EventConstructor = getEvent();
    if (typeof EventConstructor !== "function") {
        throw new TypeError("renderMap requires an Event runtime");
    }

    return EventConstructor;
}

function getScopeRequestAnimationFrame(
    getRequestAnimationFrame: () => BrowserRequestAnimationFrame | undefined
): BrowserRequestAnimationFrame | undefined {
    return getRequestAnimationFrame();
}

function getRequiredSetTimeout(
    getSetTimeout: () => BrowserSetTimeout | undefined
): BrowserSetTimeout {
    const setTimeoutRef = getSetTimeout();
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
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "a document");
    const getEvent = getRequiredProvider(scope.getEvent, "an Event");
    const getRequestAnimationFrame = getRequiredProvider(
        scope.getRequestAnimationFrame,
        "a requestAnimationFrame"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout"
    );

    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getRequiredClearTimeout(getClearTimeout);
            clearTimeoutRef.call(scope, timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getScopeAbortController(getAbortController);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderMap requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createChangeEvent(): Event {
            return new (getRequiredEvent(getEvent))("change");
        },
        createElement(tagName) {
            return getRequiredDocument(getDocument).createElement(tagName);
        },
        getMapContainerFallback(selector): HTMLElement {
            const documentRef = getRequiredDocument(getDocument);
            return (
                documentRef.querySelector<HTMLElement>(selector) ??
                documentRef.body
            );
        },
        querySelector(selector) {
            return getRequiredDocument(getDocument).querySelector(selector);
        },
        querySelectorAll(selector) {
            return getRequiredDocument(getDocument).querySelectorAll(selector);
        },
        querySelectorByIdFlexible(selector) {
            return querySelectorByIdFlexibleFromDocument(
                getRequiredDocument(getDocument),
                selector
            );
        },
        requestAnimationFrame(frameCallback): void {
            const requestAnimationFrameRef = getScopeRequestAnimationFrame(
                getRequestAnimationFrame
            );
            if (typeof requestAnimationFrameRef === "function") {
                requestAnimationFrameRef.call(scope, frameCallback);
                return;
            }

            const setTimeoutRef = getRequiredSetTimeout(getSetTimeout);
            setTimeoutRef.call(scope, () => frameCallback(0), 0);
        },
        setTimeout(callback, delayMs): RenderMapTimer {
            const setTimeoutRef = getRequiredSetTimeout(getSetTimeout);
            return setTimeoutRef.call(scope, callback, delayMs);
        },
    };
}

function getRequiredProvider<T>(
    provider: RenderMapRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`renderMap requires ${providerLabel} provider`);
    }

    return provider;
}

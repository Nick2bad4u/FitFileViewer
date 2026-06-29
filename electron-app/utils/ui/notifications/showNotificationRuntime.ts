import {
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type ShowNotificationTimerHandle = BrowserTimerHandle | number;

export type ShowNotificationRuntimeScope = {
    readonly getCancelAnimationFrame: ShowNotificationRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: ShowNotificationRuntimeProvider<BrowserClearTimeout>;
    readonly getDateNow: ShowNotificationRuntimeProvider<() => number>;
    readonly getDocument: ShowNotificationRuntimeProvider<ShowNotificationDocument>;
    readonly getHTMLElement: ShowNotificationRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getKeyboardEvent: ShowNotificationRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getRequestAnimationFrame: ShowNotificationRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: ShowNotificationRuntimeProvider<BrowserSetTimeout>;
};

type ShowNotificationRuntimeProvider<T> = (() => T | undefined) | undefined;

export type ShowNotificationRuntime = {
    readonly cancelAnimationFrame: (frame: number) => void;
    readonly clearTimeout: (timer: ShowNotificationTimerHandle) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly dateNow: () => number;
    readonly queryElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        duration: number
    ) => ShowNotificationTimerHandle;
};

type ShowNotificationDocument = Pick<
    Document,
    "createElement" | "querySelector"
>;

const defaultShowNotificationRuntimeScope: ShowNotificationRuntimeScope = {
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getKeyboardEvent: getBrowserKeyboardEvent,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

function getCancelAnimationFrame(
    getCancelAnimationFrameRef: () => BrowserCancelAnimationFrame | undefined
): BrowserCancelAnimationFrame | undefined {
    return getCancelAnimationFrameRef();
}

function getClearTimeout(
    getClearTimeoutRef: () => BrowserClearTimeout | undefined
): BrowserClearTimeout | undefined {
    return getClearTimeoutRef();
}

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("show notification runtime requires dateNow");
    }

    return dateNow;
}

function getRequiredDocument(
    getDocument: () => ShowNotificationDocument | undefined
): ShowNotificationDocument {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("show notification runtime requires document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    getHTMLElement: () => BrowserHTMLElementConstructor | undefined
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("show notification runtime requires HTMLElement");
    }

    return HTMLElementConstructor;
}

function getKeyboardEventConstructor(
    getKeyboardEvent: () => BrowserKeyboardEventConstructor | undefined
): BrowserKeyboardEventConstructor {
    const KeyboardEventConstructor = getKeyboardEvent();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError("show notification runtime requires KeyboardEvent");
    }

    return KeyboardEventConstructor;
}

function getRequestAnimationFrame(
    getRequestAnimationFrameRef: () => BrowserRequestAnimationFrame | undefined
): BrowserRequestAnimationFrame | undefined {
    return getRequestAnimationFrameRef();
}

function getSetTimeout(
    getSetTimeoutRef: () => BrowserSetTimeout | undefined
): BrowserSetTimeout | undefined {
    return getSetTimeoutRef();
}

export function getShowNotificationRuntime(
    scope: ShowNotificationRuntimeScope = defaultShowNotificationRuntimeScope
): ShowNotificationRuntime {
    const getCancelAnimationFrameRef = getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    );
    const getClearTimeoutRef = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getDateNow = getRequiredProvider(scope.getDateNow, "dateNow");
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getHTMLElement = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    );
    const getKeyboardEvent = getRequiredProvider(
        scope.getKeyboardEvent,
        "KeyboardEvent"
    );
    const getRequestAnimationFrameRef = getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    );
    const getSetTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        cancelAnimationFrame(frame) {
            const cancelFrame = getCancelAnimationFrame(
                getCancelAnimationFrameRef
            );
            if (typeof cancelFrame !== "function") {
                return;
            }
            cancelFrame.call(scope, frame);
        },
        clearTimeout(timer) {
            const clearTimer = getClearTimeout(getClearTimeoutRef);
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires clearTimeout"
                );
            }
            clearTimer.call(scope, timer);
        },
        createElement(tagName) {
            return getRequiredDocument(getDocument).createElement(tagName);
        },
        dateNow() {
            return getRequiredDateNow(getDateNow)();
        },
        queryElement(selector) {
            return getRequiredDocument(getDocument).querySelector(selector);
        },
        isHTMLElement(value) {
            return value instanceof getHTMLElementConstructor(getHTMLElement);
        },
        isKeyboardEvent(value) {
            return (
                value instanceof getKeyboardEventConstructor(getKeyboardEvent)
            );
        },
        requestAnimationFrame(onFrame) {
            const requestFrame = getRequestAnimationFrame(
                getRequestAnimationFrameRef
            );
            if (typeof requestFrame !== "function") {
                onFrame(0);
                return null;
            }
            return requestFrame.call(scope, onFrame);
        },
        setTimeout(callback, duration) {
            const setTimer = getSetTimeout(getSetTimeoutRef);
            if (typeof setTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires setTimeout"
                );
            }
            return setTimer.call(scope, callback, duration);
        },
    };
}

function getRequiredProvider<T>(
    provider: ShowNotificationRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `show notification runtime requires ${providerName} provider`
        );
    }

    return provider;
}

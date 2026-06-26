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
    readonly getCancelAnimationFrame?:
        | (() => BrowserCancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?:
        | (() => ShowNotificationDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => BrowserKeyboardEventConstructor | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
};

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
    scope: ShowNotificationRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getClearTimeout(
    scope: ShowNotificationRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getRequiredDateNow(scope: ShowNotificationRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("show notification runtime requires dateNow");
    }

    return dateNow;
}

function getRequiredDocument(
    scope: ShowNotificationRuntimeScope
): ShowNotificationDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("show notification runtime requires document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: ShowNotificationRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("show notification runtime requires HTMLElement");
    }

    return HTMLElementConstructor;
}

function getKeyboardEventConstructor(
    scope: ShowNotificationRuntimeScope
): BrowserKeyboardEventConstructor {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError("show notification runtime requires KeyboardEvent");
    }

    return KeyboardEventConstructor;
}

function getRequestAnimationFrame(
    scope: ShowNotificationRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getSetTimeout(
    scope: ShowNotificationRuntimeScope
): BrowserSetTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getShowNotificationRuntime(
    scope: ShowNotificationRuntimeScope = defaultShowNotificationRuntimeScope
): ShowNotificationRuntime {
    return {
        cancelAnimationFrame(frame) {
            const cancelFrame = getCancelAnimationFrame(scope);
            if (typeof cancelFrame !== "function") {
                return;
            }
            cancelFrame.call(scope, frame);
        },
        clearTimeout(timer) {
            const clearTimer = getClearTimeout(scope);
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires clearTimeout"
                );
            }
            clearTimer.call(scope, timer);
        },
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },
        dateNow() {
            return getRequiredDateNow(scope)();
        },
        queryElement(selector) {
            return getRequiredDocument(scope).querySelector(selector);
        },
        isHTMLElement(value) {
            return value instanceof getHTMLElementConstructor(scope);
        },
        isKeyboardEvent(value) {
            return value instanceof getKeyboardEventConstructor(scope);
        },
        requestAnimationFrame(onFrame) {
            const requestFrame = getRequestAnimationFrame(scope);
            if (typeof requestFrame !== "function") {
                onFrame(0);
                return null;
            }
            return requestFrame.call(scope, onFrame);
        },
        setTimeout(callback, duration) {
            const setTimer = getSetTimeout(scope);
            if (typeof setTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires setTimeout"
                );
            }
            return setTimer.call(scope, callback, duration);
        },
    };
}

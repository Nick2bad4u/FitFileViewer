export type ShowNotificationTimerHandle =
    | number
    | ReturnType<typeof globalThis.setTimeout>;

export type ShowNotificationRuntimeScope = {
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => ShowNotificationDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
};

export type ShowNotificationRuntime = {
    readonly cancelAnimationFrame: (frame: number) => void;
    readonly clearTimeout: (timer: ShowNotificationTimerHandle) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
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
    getCancelAnimationFrame: () =>
        globalThis.cancelAnimationFrame?.bind(globalThis),
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getKeyboardEvent: () => globalThis.KeyboardEvent,
    getRequestAnimationFrame: () =>
        globalThis.requestAnimationFrame?.bind(globalThis),
    getSetTimeout: () => globalThis.setTimeout,
};

function getCancelAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getClearTimeout(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
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
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "show notification runtime requires HTMLElement"
        );
    }

    return HTMLElementConstructor;
}

function getKeyboardEventConstructor(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.KeyboardEvent {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError(
            "show notification runtime requires KeyboardEvent"
        );
    }

    return KeyboardEventConstructor;
}

function getRequestAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getSetTimeout(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.setTimeout | undefined {
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

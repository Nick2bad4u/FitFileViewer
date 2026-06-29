import {
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserMutationObserverConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserMutationObserver,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type MapActionButtonTimer = BrowserTimerHandle;

export interface MapActionButtonsRuntimeScope {
    readonly getClearTimeout: MapActionButtonsRuntimeProvider<
        BrowserClearTimeout
    >;
    readonly getDateNow: MapActionButtonsRuntimeProvider<() => number>;
    readonly getDocument: MapActionButtonsRuntimeProvider<Document>;
    readonly getHTMLElement: MapActionButtonsRuntimeProvider<
        BrowserHTMLElementConstructor
    >;
    readonly getKeyboardEvent: MapActionButtonsRuntimeProvider<
        BrowserKeyboardEventConstructor
    >;
    readonly getMutationObserver: MapActionButtonsRuntimeProvider<
        BrowserMutationObserverConstructor
    >;
    readonly getSetTimeout: MapActionButtonsRuntimeProvider<
        BrowserSetTimeout
    >;
}

export interface MapActionButtonsRuntime {
    clearTimeout: (timer: MapActionButtonTimer) => void;
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    dateNow: () => number;
    getDocument: () => Document;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    setTimeout: (callback: () => void, delayMs: number) => MapActionButtonTimer;
}

const defaultMapActionButtonsRuntimeScope: MapActionButtonsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getKeyboardEvent: getBrowserKeyboardEvent,
    getMutationObserver: getBrowserMutationObserver,
    getSetTimeout: getBrowserSetTimeout,
};

type MapActionButtonsRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("mapActionButtonsRuntime requires dateNow");
}

function getMutationObserverConstructor(
    getMutationObserver: () =>
        | BrowserMutationObserverConstructor
        | undefined
): BrowserMutationObserverConstructor {
    const MutationObserverConstructor = getMutationObserver();
    if (typeof MutationObserverConstructor !== "function") {
        throw new TypeError(
            "mapActionButtonsRuntime requires MutationObserver"
        );
    }

    return MutationObserverConstructor;
}

export function getMapActionButtonsRuntime(
    scope: MapActionButtonsRuntimeScope = defaultMapActionButtonsRuntimeScope
): MapActionButtonsRuntime {
    const getClearTimeout = getRequiredProvider(
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
    const getMutationObserver = getRequiredProvider(
        scope.getMutationObserver,
        "MutationObserver"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        createMutationObserver(callback): MutationObserver {
            return new (getMutationObserverConstructor(getMutationObserver))(
                callback
            );
        },
        dateNow(): number {
            return getRequiredDateNow(getDateNow)();
        },
        getDocument(): Document {
            const runtimeDocument = getDocument();
            if (!runtimeDocument) {
                throw new TypeError(
                    "mapActionButtonsRuntime requires document"
                );
            }

            return runtimeDocument;
        },
        isHTMLElement(value): value is HTMLElement {
            const HTMLElementConstructor = getHTMLElement();
            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
        isKeyboardEvent(value): value is KeyboardEvent {
            const KeyboardEventConstructor = getKeyboardEvent();
            return (
                typeof KeyboardEventConstructor === "function" &&
                value instanceof KeyboardEventConstructor
            );
        },
        setTimeout(callback, delayMs): MapActionButtonTimer {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

function getRequiredProvider<T>(
    provider: MapActionButtonsRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `mapActionButtonsRuntime requires ${providerLabel} provider`
        );
    }

    return provider;
}

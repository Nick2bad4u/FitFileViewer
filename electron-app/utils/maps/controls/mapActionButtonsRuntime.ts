export type MapActionButtonTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapActionButtonsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getMutationObserver?:
        | (() => typeof globalThis.MutationObserver | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapActionButtonsRuntime {
    clearTimeout: (timer: MapActionButtonTimer) => void;
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    getDocument: () => Document;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    setTimeout: (callback: () => void, delayMs: number) => MapActionButtonTimer;
}

const defaultMapActionButtonsRuntimeScope: MapActionButtonsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getKeyboardEvent: () => globalThis.KeyboardEvent,
    getMutationObserver: () => globalThis.MutationObserver,
    getSetTimeout: () => globalThis.setTimeout,
};

function getMutationObserverConstructor(
    scope: MapActionButtonsRuntimeScope
): typeof globalThis.MutationObserver {
    const MutationObserverConstructor = scope.getMutationObserver?.();
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
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        createMutationObserver(callback): MutationObserver {
            return new (getMutationObserverConstructor(scope))(callback);
        },
        getDocument(): Document {
            const runtimeDocument = scope.getDocument?.();
            if (!runtimeDocument) {
                throw new TypeError(
                    "mapActionButtonsRuntime requires document"
                );
            }

            return runtimeDocument;
        },
        isHTMLElement(value): value is HTMLElement {
            const HTMLElementConstructor = scope.getHTMLElement?.();
            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
        isKeyboardEvent(value): value is KeyboardEvent {
            const KeyboardEventConstructor = scope.getKeyboardEvent?.();
            return (
                typeof KeyboardEventConstructor === "function" &&
                value instanceof KeyboardEventConstructor
            );
        },
        setTimeout(callback, delayMs): MapActionButtonTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

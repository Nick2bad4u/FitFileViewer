export type MapActionButtonTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapActionButtonsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapActionButtonsRuntime {
    clearTimeout: (timer: MapActionButtonTimer) => void;
    getDocument: () => Document;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    setTimeout: (callback: () => void, delayMs: number) => MapActionButtonTimer;
}

const defaultMapActionButtonsRuntimeScope: MapActionButtonsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getSetTimeout: () => globalThis.setTimeout,
};

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

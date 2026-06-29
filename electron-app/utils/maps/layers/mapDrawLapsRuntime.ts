import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserSVGElementConstructor,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserSetTimeout,
    getBrowserSVGElement,
} from "../../runtime/browserRuntime.js";

export type MapDrawLapsTimer = BrowserTimerHandle;

type MapDrawLapsDocument = Pick<Document, "createElement" | "createTextNode">;

export interface MapDrawLapsRuntimeScope {
    readonly getClearTimeout:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument: (() => MapDrawLapsDocument | undefined) | undefined;
    readonly getSetTimeout: (() => BrowserSetTimeout | undefined) | undefined;
    readonly getSVGElement:
        | (() => BrowserSVGElementConstructor | undefined)
        | undefined;
}

export interface MapDrawLapsRuntime {
    clearTimeout: (timer: MapDrawLapsTimer) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createTextNode: (data: string) => Text;
    isSVGElement: (value: unknown) => value is SVGElement;
    setTimeout: (callback: () => void, delayMs: number) => MapDrawLapsTimer;
}

const defaultMapDrawLapsRuntimeScope: MapDrawLapsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getSetTimeout: getBrowserSetTimeout,
    getSVGElement: getBrowserSVGElement,
};

function getScopeClearTimeout(
    scope: MapDrawLapsRuntimeScope
): BrowserClearTimeout | undefined {
    const getClearTimeout = scope.getClearTimeout;
    if (typeof getClearTimeout !== "function") {
        throw new TypeError(
            "mapDrawLapsRuntime requires a clearTimeout provider"
        );
    }

    return getClearTimeout();
}

function getScopeDocument(
    scope: MapDrawLapsRuntimeScope
): MapDrawLapsDocument | undefined {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError("mapDrawLapsRuntime requires a document provider");
    }

    return getDocument();
}

function getScopeSetTimeout(
    scope: MapDrawLapsRuntimeScope
): BrowserSetTimeout | undefined {
    const getSetTimeout = scope.getSetTimeout;
    if (typeof getSetTimeout !== "function") {
        throw new TypeError(
            "mapDrawLapsRuntime requires a setTimeout provider"
        );
    }

    return getSetTimeout();
}

function getRequiredSVGElement(
    scope: MapDrawLapsRuntimeScope
): BrowserSVGElementConstructor {
    const getSVGElement = scope.getSVGElement;
    if (typeof getSVGElement !== "function") {
        throw new TypeError(
            "mapDrawLapsRuntime requires an SVGElement provider"
        );
    }

    const SVGElementConstructor = getSVGElement();
    if (typeof SVGElementConstructor !== "function") {
        throw new TypeError("mapDrawLapsRuntime requires SVGElement");
    }

    return SVGElementConstructor;
}

function getRequiredDocument(
    scope: MapDrawLapsRuntimeScope
): MapDrawLapsDocument {
    const documentRef = getScopeDocument(scope);
    if (!documentRef) {
        throw new TypeError("mapDrawLapsRuntime requires document");
    }

    return documentRef;
}

export function getMapDrawLapsRuntime(
    scope: MapDrawLapsRuntimeScope = defaultMapDrawLapsRuntimeScope
): MapDrawLapsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("mapDrawLapsRuntime requires clearTimeout");
            }

            clearTimeoutRef(timer);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createTextNode(data): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        isSVGElement(value): value is SVGElement {
            return value instanceof getRequiredSVGElement(scope);
        },
        setTimeout(callback, delayMs): MapDrawLapsTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("mapDrawLapsRuntime requires setTimeout");
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

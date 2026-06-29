import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type MapMeasureToolTimer = BrowserTimerHandle;

type MapMeasureToolDocument = Document;
type MapMeasureToolKeydownListener = (event: Readonly<KeyboardEvent>) => void;

export interface MapMeasureToolRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument:
        | (() => MapMeasureToolDocument | undefined)
        | undefined;
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface MapMeasureToolRuntime {
    readonly addDocumentKeydownListener: (
        listener: MapMeasureToolKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly clearTimeout: (timer: MapMeasureToolTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly createTextNode: (data: string) => Text;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly removeDocumentKeydownListener: (
        listener: MapMeasureToolKeydownListener
    ) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MapMeasureToolTimer;
}

const defaultMapMeasureToolRuntimeScope: MapMeasureToolRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredDocument(
    scope: MapMeasureToolRuntimeScope
): MapMeasureToolDocument {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError("mapMeasureTool requires a document provider");
    }

    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("mapMeasureTool requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredHTMLElement(
    scope: MapMeasureToolRuntimeScope
): BrowserHTMLElementConstructor {
    const getHTMLElement = scope.getHTMLElement;
    if (typeof getHTMLElement !== "function") {
        throw new TypeError("mapMeasureTool requires an HTMLElement provider");
    }

    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("mapMeasureTool requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: MapMeasureToolRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRequiredDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getMapMeasureToolRuntime(
    scope: MapMeasureToolRuntimeScope = defaultMapMeasureToolRuntimeScope
): MapMeasureToolRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const runtimeDocument = getRequiredDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("keydown", listener, options);
        },
        clearTimeout(timer): void {
            const getClearTimeout = scope.getClearTimeout;
            if (typeof getClearTimeout !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a clearTimeout provider"
                );
            }

            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const getAbortController = scope.getAbortController;
            if (typeof getAbortController !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires an AbortController provider"
                );
            }

            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createSvgElement(tagName) {
            return createSvgElement(scope, tagName);
        },
        createTextNode(data): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        isHTMLElement(value): value is HTMLElement {
            return value instanceof getRequiredHTMLElement(scope);
        },
        removeDocumentKeydownListener(listener): void {
            const runtimeDocument = getRequiredDocument(scope);

            runtimeDocument.removeEventListener("keydown", listener);
        },
        setTimeout(callback, delayMs): MapMeasureToolTimer {
            const getSetTimeout = scope.getSetTimeout;
            if (typeof getSetTimeout !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a setTimeout provider"
                );
            }

            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

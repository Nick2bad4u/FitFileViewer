import {
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type MapMeasureToolTimer = ReturnType<typeof globalThis.setTimeout>;

type MapMeasureToolDocument = Document;
type MapMeasureToolKeydownListener = (event: Readonly<KeyboardEvent>) => void;

export interface MapMeasureToolRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapMeasureToolDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredDocument(
    scope: MapMeasureToolRuntimeScope
): MapMeasureToolDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapMeasureTool requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredHTMLElement(
    scope: MapMeasureToolRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
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
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
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
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

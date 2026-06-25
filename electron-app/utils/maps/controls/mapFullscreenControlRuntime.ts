import {
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type MapFullscreenControlTimer = ReturnType<
    typeof globalThis.setTimeout
>;

type MapFullscreenControlDocument = Document;

export interface MapFullscreenControlRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapFullscreenControlDocument | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapFullscreenControlRuntime {
    readonly addDocumentFullscreenChangeListener: (
        listener: EventListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly clearTimeout: (timer: MapFullscreenControlTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly documentBodyContains: (element: Element) => boolean;
    readonly exitFullscreen: () => Promise<void> | void;
    readonly getLegacyFullscreenButton: () => Element | null;
    readonly getMapContainer: () => HTMLElement | null;
    readonly isFullscreenElement: (element: Element) => boolean;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MapFullscreenControlTimer;
}

const defaultMapFullscreenControlRuntimeScope: MapFullscreenControlRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: () => globalThis.document,
        getSetTimeout: getBrowserSetTimeout,
    };

function getRuntimeDocument(
    scope: MapFullscreenControlRuntimeScope
): MapFullscreenControlDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapFullscreenControl requires a document runtime");
    }

    return runtimeDocument;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: MapFullscreenControlRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRuntimeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getMapFullscreenControlRuntime(
    scope: MapFullscreenControlRuntimeScope = defaultMapFullscreenControlRuntimeScope
): MapFullscreenControlRuntime {
    return {
        addDocumentFullscreenChangeListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener(
                "fullscreenchange",
                listener,
                options
            );
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRuntimeDocument(scope).createElement(tagName);
        },
        createSvgElement(tagName) {
            return createSvgElement(scope, tagName);
        },
        documentBodyContains(element): boolean {
            return getRuntimeDocument(scope).body.contains(element);
        },
        exitFullscreen(): Promise<void> | void {
            const runtimeDocument = getRuntimeDocument(scope);
            return runtimeDocument.exitFullscreen();
        },
        getLegacyFullscreenButton(): Element | null {
            return getRuntimeDocument(scope).querySelector(
                "#map-controls #fullscreen-btn"
            );
        },
        getMapContainer(): HTMLElement | null {
            return getRuntimeDocument(scope).querySelector<HTMLElement>(
                "#leaflet-map"
            );
        },
        isFullscreenElement(element): boolean {
            return getRuntimeDocument(scope).fullscreenElement === element;
        },
        setTimeout(callback, delayMs): MapFullscreenControlTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

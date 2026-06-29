import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type MapFullscreenControlTimer = BrowserTimerHandle;

type MapFullscreenControlDocument = Document;

export interface MapFullscreenControlRuntimeScope {
    readonly getAbortController: MapFullscreenControlRuntimeProvider<
        BrowserAbortControllerConstructor
    >;
    readonly getClearTimeout: MapFullscreenControlRuntimeProvider<
        BrowserClearTimeout
    >;
    readonly getDocument: MapFullscreenControlRuntimeProvider<
        MapFullscreenControlDocument
    >;
    readonly getSetTimeout: MapFullscreenControlRuntimeProvider<
        BrowserSetTimeout
    >;
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
        getDocument: getBrowserDocument,
        getSetTimeout: getBrowserSetTimeout,
    };

type MapFullscreenControlRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

function getRuntimeDocument(
    getDocument: () => MapFullscreenControlDocument | undefined
): MapFullscreenControlDocument {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("mapFullscreenControl requires a document runtime");
    }

    return runtimeDocument;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    getDocument: () => MapFullscreenControlDocument | undefined,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRuntimeDocument(getDocument);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getMapFullscreenControlRuntime(
    scope: MapFullscreenControlRuntimeScope = defaultMapFullscreenControlRuntimeScope
): MapFullscreenControlRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "a document");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout"
    );

    return {
        addDocumentFullscreenChangeListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(getDocument);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener(
                "fullscreenchange",
                listener,
                options
            );
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRuntimeDocument(getDocument).createElement(tagName);
        },
        createSvgElement(tagName) {
            return createSvgElement(getDocument, tagName);
        },
        documentBodyContains(element): boolean {
            return getRuntimeDocument(getDocument).body.contains(element);
        },
        exitFullscreen(): Promise<void> | void {
            const runtimeDocument = getRuntimeDocument(getDocument);
            return runtimeDocument.exitFullscreen();
        },
        getLegacyFullscreenButton(): Element | null {
            return getRuntimeDocument(getDocument).querySelector(
                "#map-controls #fullscreen-btn"
            );
        },
        getMapContainer(): HTMLElement | null {
            return getRuntimeDocument(getDocument).querySelector<HTMLElement>(
                "#leaflet-map"
            );
        },
        isFullscreenElement(element): boolean {
            return (
                getRuntimeDocument(getDocument).fullscreenElement === element
            );
        },
        setTimeout(callback, delayMs): MapFullscreenControlTimer {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

function getRequiredProvider<T>(
    provider: MapFullscreenControlRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `mapFullscreenControl requires ${providerLabel} provider`
        );
    }

    return provider;
}

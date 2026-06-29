import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    type BrowserCancelAnimationFrame,
    type BrowserRequestAnimationFrame,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserCancelAnimationFrame,
    getBrowserDocument,
    getBrowserLocalStorage,
    getBrowserRequestAnimationFrame,
} from "../../runtime/browserRuntime.js";

import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

type RenderSummaryStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type RenderSummaryRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface RenderSummaryRuntimeScope {
    readonly getAbortController: RenderSummaryRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getAddEventListener: RenderSummaryRuntimeProvider<BrowserAddEventListener>;
    readonly getCancelAnimationFrame: RenderSummaryRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getDocument: RenderSummaryRuntimeProvider<Document>;
    readonly getLocalStorage: RenderSummaryRuntimeProvider<RenderSummaryStorage>;
    readonly getRequestAnimationFrame: RenderSummaryRuntimeProvider<BrowserRequestAnimationFrame>;
}

export interface RenderSummaryRuntime {
    readonly addResizeListener: (
        listener: Readonly<EventListener>,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createDocumentFragment: () => DocumentFragment;
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly getStorageItem: (key: string) => string | null;
    readonly getSummaryContainer: () => HTMLElement | null;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly removeStorageItem: (key: string) => void;
    readonly setStorageItem: (key: string, value: string) => void;
}

const defaultRenderSummaryRuntimeScope: RenderSummaryRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getAddEventListener: getBrowserAddEventListener,
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getDocument: getBrowserDocument,
    getLocalStorage: getBrowserLocalStorage,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
};

function getScopeDocument(getDocument: () => Document | undefined): Document {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("renderSummary requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredLocalStorage(
    getLocalStorage: () => RenderSummaryStorage | undefined
): RenderSummaryStorage {
    const storage = getLocalStorage();
    if (!storage) {
        throw new TypeError("renderSummary requires a localStorage runtime");
    }

    return storage;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    getDocument: () => Document | undefined,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getScopeDocument(getDocument);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getRenderSummaryRuntime(
    scope: RenderSummaryRuntimeScope = defaultRenderSummaryRuntimeScope
): RenderSummaryRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getAddEventListener = getRequiredProvider(
        scope.getAddEventListener,
        "addEventListener"
    );
    const getCancelAnimationFrame = getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getLocalStorage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    );
    const getRequestAnimationFrame = getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    );

    return {
        addResizeListener(
            listener: Readonly<EventListener>,
            options?: Readonly<AddEventListenerOptions>
        ): void {
            const addEventListenerRef = getAddEventListener();
            addEventListenerRef?.call(
                scope,
                "resize",
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM listener registration requires the mutable EventListener shape at this adapter boundary.
                listener as EventListener,
                options
            );
        },
        cancelAnimationFrame(handle: number): void {
            getCancelAnimationFrame()?.call(scope, handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderSummary requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getScopeDocument(getDocument).createElement(tagName);
        },
        createDocumentFragment() {
            return getScopeDocument(getDocument).createDocumentFragment();
        },
        createSvgElement(tagName) {
            return createSvgElement(getDocument, tagName);
        },
        getStorageItem(key): string | null {
            return getRequiredLocalStorage(getLocalStorage).getItem(key);
        },
        getSummaryContainer(): HTMLElement | null {
            return getElementByIdFlexible(
                getScopeDocument(getDocument),
                "content_summary"
            );
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef = getRequestAnimationFrame();
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        removeStorageItem(key): void {
            getRequiredLocalStorage(getLocalStorage).removeItem(key);
        },
        setStorageItem(key, value): void {
            getRequiredLocalStorage(getLocalStorage).setItem(key, value);
        },
    };
}

function getRequiredProvider<T>(
    provider: RenderSummaryRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`renderSummary requires ${providerName} provider`);
    }

    return provider;
}

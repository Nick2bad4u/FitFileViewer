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

export interface RenderSummaryRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => BrowserAddEventListener | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => BrowserCancelAnimationFrame | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getLocalStorage?:
        | (() => RenderSummaryStorage | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
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

function getScopeAbortController(
    scope: RenderSummaryRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getScopeAddEventListener(
    scope: RenderSummaryRuntimeScope
): BrowserAddEventListener | undefined {
    return scope.getAddEventListener?.();
}

function getScopeCancelAnimationFrame(
    scope: RenderSummaryRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeDocument(scope: RenderSummaryRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("renderSummary requires a document runtime");
    }

    return runtimeDocument;
}

function getRequiredLocalStorage(
    scope: RenderSummaryRuntimeScope
): RenderSummaryStorage {
    const storage = scope.getLocalStorage?.();
    if (!storage) {
        throw new TypeError("renderSummary requires a localStorage runtime");
    }

    return storage;
}

function getScopeRequestAnimationFrame(
    scope: RenderSummaryRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: RenderSummaryRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getScopeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getRenderSummaryRuntime(
    scope: RenderSummaryRuntimeScope = defaultRenderSummaryRuntimeScope
): RenderSummaryRuntime {
    return {
        addResizeListener(
            listener: Readonly<EventListener>,
            options?: Readonly<AddEventListenerOptions>
        ): void {
            const addEventListenerRef = getScopeAddEventListener(scope);
            addEventListenerRef?.call(
                scope,
                "resize",
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM listener registration requires the mutable EventListener shape at this adapter boundary.
                listener as EventListener,
                options
            );
        },
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderSummary requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getScopeDocument(scope).createElement(tagName);
        },
        createDocumentFragment() {
            return getScopeDocument(scope).createDocumentFragment();
        },
        createSvgElement(tagName) {
            return createSvgElement(scope, tagName);
        },
        getStorageItem(key): string | null {
            return getRequiredLocalStorage(scope).getItem(key);
        },
        getSummaryContainer(): HTMLElement | null {
            return getElementByIdFlexible(
                getScopeDocument(scope),
                "content_summary"
            );
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        removeStorageItem(key): void {
            getRequiredLocalStorage(scope).removeItem(key);
        },
        setStorageItem(key, value): void {
            getRequiredLocalStorage(scope).setItem(key, value);
        },
    };
}

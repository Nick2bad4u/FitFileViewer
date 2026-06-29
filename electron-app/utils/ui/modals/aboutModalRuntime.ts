import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";
import {
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserDOMParserConstructor,
    type BrowserElementConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserNodeFilter,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserDOMParser,
    getBrowserElement,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserNodeFilter,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type AboutModalTimerHandle = BrowserTimerHandle;
type AboutModalRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface AboutModalRuntimeScope {
    readonly getCancelAnimationFrame: AboutModalRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: AboutModalRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: AboutModalRuntimeProvider<Document>;
    readonly getDOMParser: AboutModalRuntimeProvider<BrowserDOMParserConstructor>;
    readonly getElement: AboutModalRuntimeProvider<BrowserElementConstructor>;
    readonly getHTMLElement: AboutModalRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getKeyboardEvent: AboutModalRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getNodeFilter: AboutModalRuntimeProvider<BrowserNodeFilter>;
    readonly getRequestAnimationFrame: AboutModalRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: AboutModalRuntimeProvider<BrowserSetTimeout>;
}

export interface AboutModalRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: AboutModalTimerHandle) => void;
    readonly createDocumentFragment: () => DocumentFragment;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createElementTreeWalker: (root: Node) => TreeWalker;
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly getActiveHTMLElement: () => HTMLElement | null;
    readonly getDocument: () => Document | undefined;
    readonly getDocumentEventTarget: () => Document;
    readonly isElement: (value: unknown) => value is Element;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    readonly parseHtmlDocument: (html: string) => Document;
    readonly queryElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly queryElements: <TElement extends Element = Element>(
        selector: string
    ) => NodeListOf<TElement>;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => AboutModalTimerHandle;
}

const defaultAboutModalRuntimeScope: AboutModalRuntimeScope = {
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getDOMParser: getBrowserDOMParser,
    getElement: getBrowserElement,
    getHTMLElement: getBrowserHTMLElement,
    getKeyboardEvent: getBrowserKeyboardEvent,
    getNodeFilter: getBrowserNodeFilter,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: AboutModalRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `aboutModalRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getScopeCancelAnimationFrame(
    scope: AboutModalRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    )();
}

function getScopeClearTimeout(
    scope: AboutModalRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getScopeDocument(scope: AboutModalRuntimeScope): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function requireScopeDocument(scope: AboutModalRuntimeScope): Document {
    const documentRef = getScopeDocument(scope);
    if (!documentRef) {
        throw new TypeError("aboutModalRuntime requires a document runtime");
    }
    return documentRef;
}

function getScopeDOMParser(
    scope: AboutModalRuntimeScope
): BrowserDOMParserConstructor | undefined {
    return getRequiredProvider(scope.getDOMParser, "DOMParser")();
}

function getScopeElement(
    scope: AboutModalRuntimeScope
): BrowserElementConstructor | undefined {
    return getRequiredProvider(scope.getElement, "Element")();
}

function getScopeHTMLElement(
    scope: AboutModalRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

function getScopeKeyboardEvent(
    scope: AboutModalRuntimeScope
): BrowserKeyboardEventConstructor | undefined {
    return getRequiredProvider(scope.getKeyboardEvent, "KeyboardEvent")();
}

function getScopeNodeFilter(
    scope: AboutModalRuntimeScope
): BrowserNodeFilter | undefined {
    return getRequiredProvider(scope.getNodeFilter, "NodeFilter")();
}

function getScopeRequestAnimationFrame(
    scope: AboutModalRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    )();
}

function getScopeSetTimeout(
    scope: AboutModalRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: AboutModalRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = requireScopeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getAboutModalRuntime(
    scope: AboutModalRuntimeScope = defaultAboutModalRuntimeScope
): AboutModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: AboutModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "aboutModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        createDocumentFragment(): DocumentFragment {
            return requireScopeDocument(scope).createDocumentFragment();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return requireScopeDocument(scope).createElement(tagName);
        },
        createElementTreeWalker(root: Node): TreeWalker {
            const NodeFilterRef = getScopeNodeFilter(scope);
            if (!NodeFilterRef) {
                throw new TypeError(
                    "aboutModalRuntime requires a NodeFilter runtime"
                );
            }
            return requireScopeDocument(scope).createTreeWalker(
                root,
                NodeFilterRef.SHOW_ELEMENT
            );
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        getActiveHTMLElement(): HTMLElement | null {
            const activeElement = requireScopeDocument(scope).activeElement;
            const HTMLElementRef = getScopeHTMLElement(scope);
            return typeof HTMLElementRef === "function" &&
                activeElement instanceof HTMLElementRef
                ? activeElement
                : null;
        },
        getDocument(): Document | undefined {
            return getScopeDocument(scope);
        },
        getDocumentEventTarget(): Document {
            return requireScopeDocument(scope);
        },
        isElement(value: unknown): value is Element {
            const ElementRef = getScopeElement(scope);
            return (
                typeof ElementRef === "function" && value instanceof ElementRef
            );
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            const HTMLElementRef = getScopeHTMLElement(scope);
            return (
                typeof HTMLElementRef === "function" &&
                value instanceof HTMLElementRef
            );
        },
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            const KeyboardEventRef = getScopeKeyboardEvent(scope);
            return (
                typeof KeyboardEventRef === "function" &&
                value instanceof KeyboardEventRef
            );
        },
        parseHtmlDocument(html: string): Document {
            const DOMParserRef = getScopeDOMParser(scope);
            if (typeof DOMParserRef !== "function") {
                throw new TypeError(
                    "aboutModalRuntime requires a DOMParser runtime"
                );
            }
            // eslint-disable-next-line sdl/no-domparser-html-without-sanitization -- Sanitization happens immediately in sanitizeAboutBodyHtml before callers receive the fragment.
            return new DOMParserRef().parseFromString(html, "text/html");
        },
        queryElement<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return requireScopeDocument(scope).querySelector<TElement>(
                selector
            );
        },
        queryElements<TElement extends Element = Element>(
            selector: string
        ): NodeListOf<TElement> {
            return requireScopeDocument(scope).querySelectorAll<TElement>(
                selector
            );
        },
        requestAnimationFrame(onFrame: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                onFrame(0);
                return null;
            }

            return requestAnimationFrameRef.call(scope, onFrame);
        },
        setTimeout(callback: () => void, delay: number): AboutModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "aboutModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}

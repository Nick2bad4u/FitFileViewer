import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export type AboutModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface AboutModalRuntimeScope {
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDOMParser?:
        | (() => typeof globalThis.DOMParser | undefined)
        | undefined;
    readonly getElement?:
        | (() => typeof globalThis.Element | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getNodeFilter?:
        | (() => typeof globalThis.NodeFilter | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getDOMParser: () => globalThis.DOMParser,
    getElement: () => globalThis.Element,
    getHTMLElement: () => globalThis.HTMLElement,
    getKeyboardEvent: () => globalThis.KeyboardEvent,
    getNodeFilter: () => globalThis.NodeFilter,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeCancelAnimationFrame(
    scope: AboutModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: AboutModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeDocument(scope: AboutModalRuntimeScope): Document | undefined {
    return scope.getDocument?.();
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
): typeof globalThis.DOMParser | undefined {
    return scope.getDOMParser?.();
}

function getScopeElement(
    scope: AboutModalRuntimeScope
): typeof globalThis.Element | undefined {
    return scope.getElement?.();
}

function getScopeHTMLElement(
    scope: AboutModalRuntimeScope
): typeof globalThis.HTMLElement | undefined {
    return scope.getHTMLElement?.();
}

function getScopeKeyboardEvent(
    scope: AboutModalRuntimeScope
): typeof globalThis.KeyboardEvent | undefined {
    return scope.getKeyboardEvent?.();
}

function getScopeNodeFilter(
    scope: AboutModalRuntimeScope
): typeof globalThis.NodeFilter | undefined {
    return scope.getNodeFilter?.();
}

function getScopeRequestAnimationFrame(
    scope: AboutModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: AboutModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
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

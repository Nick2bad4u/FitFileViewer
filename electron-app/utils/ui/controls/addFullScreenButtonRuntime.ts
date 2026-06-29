import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserMutationObserverConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserMutationObserver,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export { SVG_NAMESPACE as FULLSCREEN_BUTTON_SVG_NAMESPACE } from "../icons/iconFactoryRuntime.js";

export interface AddFullScreenButtonRuntimeScope {
    readonly getAbortController: AddFullScreenButtonRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocumentEventTarget: AddFullScreenButtonRuntimeProvider<AddFullScreenButtonEventTarget>;
    readonly getDocument: AddFullScreenButtonRuntimeProvider<Document>;
    readonly getWindowEventTarget: AddFullScreenButtonRuntimeProvider<AddFullScreenButtonEventTarget>;
    readonly getHTMLElement: AddFullScreenButtonRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getKeyboardEvent: AddFullScreenButtonRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getMutationObserver: AddFullScreenButtonRuntimeProvider<BrowserMutationObserverConstructor>;
}

type AddFullScreenButtonEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;
type AddFullScreenButtonMutationObserver = Pick<MutationObserver, "observe">;
type AddFullScreenButtonRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface AddFullScreenButtonRuntime {
    addDocumentEventListener: (
        type: string,
        listener: EventListener,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    addWindowEventListener: (
        type: string,
        listener: EventListener,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    createAbortController: () => AbortController;
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createMutationObserver: (
        callback: MutationCallback
    ) => AddFullScreenButtonMutationObserver;
    appendToBody: (element: HTMLElement) => void;
    getDocument: () => Document;
    getElementById: (id: string) => HTMLElement | null;
    hasBodyClass: (className: string) => boolean;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    observeBody: (
        observer: AddFullScreenButtonMutationObserver,
        options: MutationObserverInit
    ) => void;
    querySelector: (selector: string) => HTMLElement | null;
    removeDocumentEventListener: (
        type: string,
        listener: EventListener
    ) => void;
    removeWindowEventListener: (type: string, listener: EventListener) => void;
}

function getRequiredProvider<T>(
    provider: AddFullScreenButtonRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `addFullScreenButton requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: AddFullScreenButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocumentEventTarget(
    scope: AddFullScreenButtonRuntimeScope
): AddFullScreenButtonEventTarget | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getDocument(scope: AddFullScreenButtonRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("addFullScreenButton requires a document runtime");
    }

    return runtimeDocument;
}

function getWindowEventTarget(
    scope: AddFullScreenButtonRuntimeScope
): AddFullScreenButtonEventTarget | undefined {
    return getRequiredProvider(
        scope.getWindowEventTarget,
        "window event-target"
    )();
}

function getHTMLElementConstructor(
    scope: AddFullScreenButtonRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

function getKeyboardEventConstructor(
    scope: AddFullScreenButtonRuntimeScope
): BrowserKeyboardEventConstructor | undefined {
    return getRequiredProvider(scope.getKeyboardEvent, "KeyboardEvent")();
}

function getMutationObserverConstructor(
    scope: AddFullScreenButtonRuntimeScope
): BrowserMutationObserverConstructor {
    const MutationObserverConstructor = getRequiredProvider(
        scope.getMutationObserver,
        "MutationObserver"
    )();
    if (typeof MutationObserverConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires a MutationObserver runtime"
        );
    }

    return MutationObserverConstructor;
}

const defaultAddFullScreenButtonRuntimeScope: AddFullScreenButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getDocumentEventTarget: getBrowserDocument,
        getWindowEventTarget: getBrowserEventTarget,
        getHTMLElement: getBrowserHTMLElement,
        getKeyboardEvent: getBrowserKeyboardEvent,
        getMutationObserver: getBrowserMutationObserver,
    };

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: AddFullScreenButtonRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getAddFullScreenButtonRuntime(
    scope: AddFullScreenButtonRuntimeScope = defaultAddFullScreenButtonRuntimeScope
): AddFullScreenButtonRuntime {
    return {
        addDocumentEventListener(type, listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            documentEventTarget?.addEventListener(type, listener, options);
        },
        addWindowEventListener(type, listener, options): void {
            const windowEventTarget = getWindowEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            windowEventTarget?.addEventListener(type, listener, options);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        createElement(tagName) {
            return getDocument(scope).createElement(tagName);
        },
        createMutationObserver(callback): AddFullScreenButtonMutationObserver {
            return new (getMutationObserverConstructor(scope))(callback);
        },
        appendToBody(element): void {
            getDocument(scope).body.append(element);
        },
        getDocument(): Document {
            return getDocument(scope);
        },
        getElementById(id): HTMLElement | null {
            return getDocument(scope).getElementById(id);
        },
        hasBodyClass(className): boolean {
            return getDocument(scope).body.classList.contains(className);
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            const HTMLElementConstructor = getHTMLElementConstructor(scope);
            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            const KeyboardEventConstructor = getKeyboardEventConstructor(scope);
            return (
                typeof KeyboardEventConstructor === "function" &&
                value instanceof KeyboardEventConstructor
            );
        },
        observeBody(observer, options): void {
            observer.observe(getDocument(scope).body, options);
        },
        querySelector(selector): HTMLElement | null {
            const element = getDocument(scope).querySelector(selector);
            return this.isHTMLElement(element) ? element : null;
        },
        removeDocumentEventListener(type, listener): void {
            const documentEventTarget = getDocumentEventTarget(scope);

            documentEventTarget?.removeEventListener(type, listener);
        },
        removeWindowEventListener(type, listener): void {
            const windowEventTarget = getWindowEventTarget(scope);

            windowEventTarget?.removeEventListener(type, listener);
        },
    };
}

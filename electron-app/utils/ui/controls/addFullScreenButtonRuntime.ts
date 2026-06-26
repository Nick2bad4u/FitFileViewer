import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserMutationObserver,
} from "../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export { SVG_NAMESPACE as FULLSCREEN_BUTTON_SVG_NAMESPACE } from "../icons/iconFactoryRuntime.js";

export interface AddFullScreenButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?:
        | (() => AddFullScreenButtonEventTarget | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getGlobalEventTarget?:
        | (() => AddFullScreenButtonEventTarget | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getMutationObserver?:
        | (() => typeof globalThis.MutationObserver | undefined)
        | undefined;
}

type AddFullScreenButtonEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;
type AddFullScreenButtonMutationObserver = Pick<MutationObserver, "observe">;

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

function getAbortControllerConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
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
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getDocument(scope: AddFullScreenButtonRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("addFullScreenButton requires a document runtime");
    }

    return runtimeDocument;
}

function getGlobalEventTarget(
    scope: AddFullScreenButtonRuntimeScope
): AddFullScreenButtonEventTarget | undefined {
    return scope.getGlobalEventTarget?.();
}

function getHTMLElementConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof globalThis.HTMLElement | undefined {
    return scope.getHTMLElement?.();
}

function getKeyboardEventConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof globalThis.KeyboardEvent | undefined {
    return scope.getKeyboardEvent?.();
}

function getMutationObserverConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof globalThis.MutationObserver {
    const MutationObserverConstructor = scope.getMutationObserver?.();
    if (typeof MutationObserverConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires a MutationObserver runtime"
        );
    }

    return MutationObserverConstructor;
}

function isAddFullScreenButtonEventTarget(
    value: unknown
): value is AddFullScreenButtonEventTarget {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<AddFullScreenButtonEventTarget>;
    return (
        typeof candidate.addEventListener === "function" &&
        typeof candidate.removeEventListener === "function"
    );
}

const defaultAddFullScreenButtonRuntimeScope: AddFullScreenButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getGlobalEventTarget: () =>
            isAddFullScreenButtonEventTarget(globalThis)
                ? globalThis
                : undefined,
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
            const globalEventTarget = getGlobalEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            globalEventTarget?.addEventListener(type, listener, options);
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
            const globalEventTarget = getGlobalEventTarget(scope);

            globalEventTarget?.removeEventListener(type, listener);
        },
    };
}

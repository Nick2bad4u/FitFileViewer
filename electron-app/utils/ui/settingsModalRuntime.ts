import { getIconFactoryRuntime } from "./icons/iconFactoryRuntime.js";
import {
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserKeyboardEvent,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../runtime/browserRuntime.js";

export type SettingsModalTimerHandle = BrowserTimerHandle;

type SettingsModalRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface SettingsModalRuntimeScope {
    readonly getCancelAnimationFrame: SettingsModalRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: SettingsModalRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: SettingsModalRuntimeProvider<Document>;
    readonly getHTMLElement: SettingsModalRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getHTMLInputElement: SettingsModalRuntimeProvider<BrowserHTMLInputElementConstructor>;
    readonly getHTMLSelectElement: SettingsModalRuntimeProvider<BrowserHTMLSelectElementConstructor>;
    readonly getKeyboardEvent: SettingsModalRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getRequestAnimationFrame: SettingsModalRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: SettingsModalRuntimeProvider<BrowserSetTimeout>;
}

export interface SettingsModalRuntime {
    readonly appendToBody: (node: Node) => void;
    readonly appendToHead: (node: Node) => void;
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: SettingsModalTimerHandle) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly getActiveHTMLElement: () => HTMLElement | undefined;
    readonly getDocumentEventTarget: () => Document;
    readonly isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    readonly isHTMLSelectElement: (
        value: unknown
    ) => value is HTMLSelectElement;
    readonly isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    readonly queryElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => SettingsModalTimerHandle;
}

const defaultSettingsModalRuntimeScope: SettingsModalRuntimeScope = {
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getHTMLInputElement: getBrowserHTMLInputElement,
    getHTMLSelectElement: getBrowserHTMLSelectElement,
    getKeyboardEvent: getBrowserKeyboardEvent,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: SettingsModalRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (provider === undefined) {
        throw new TypeError(
            `settingsModalRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

function getScopeCancelAnimationFrame(
    scope: SettingsModalRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    )();
}

function getScopeClearTimeout(
    scope: SettingsModalRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getScopeDocument(scope: SettingsModalRuntimeScope): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError("settingsModalRuntime requires a document runtime");
    }
    return documentRef;
}

function getScopeHTMLElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

function getScopeHTMLInputElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLInputElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLInputElement, "HTMLInputElement")();
}

function getScopeHTMLSelectElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLSelectElementConstructor | undefined {
    return getRequiredProvider(
        scope.getHTMLSelectElement,
        "HTMLSelectElement"
    )();
}

function getScopeKeyboardEvent(
    scope: SettingsModalRuntimeScope
): BrowserKeyboardEventConstructor | undefined {
    return getRequiredProvider(scope.getKeyboardEvent, "KeyboardEvent")();
}

function getScopeRequestAnimationFrame(
    scope: SettingsModalRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    )();
}

function getScopeSetTimeout(
    scope: SettingsModalRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: SettingsModalRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getScopeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getSettingsModalRuntime(
    scope: SettingsModalRuntimeScope = defaultSettingsModalRuntimeScope
): SettingsModalRuntime {
    return {
        appendToBody(node: Node): void {
            getScopeDocument(scope).body.append(node);
        },
        appendToHead(node: Node): void {
            getScopeDocument(scope).head.append(node);
        },
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: SettingsModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "settingsModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getScopeDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        getActiveHTMLElement(): HTMLElement | undefined {
            const activeElement = getScopeDocument(scope).activeElement;
            const HTMLElementRef = getScopeHTMLElement(scope);
            return typeof HTMLElementRef === "function" &&
                activeElement instanceof HTMLElementRef
                ? activeElement
                : undefined;
        },
        getDocumentEventTarget(): Document {
            return getScopeDocument(scope);
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            const HTMLInputElementRef = getScopeHTMLInputElement(scope);
            return (
                typeof HTMLInputElementRef === "function" &&
                value instanceof HTMLInputElementRef
            );
        },
        isHTMLSelectElement(value: unknown): value is HTMLSelectElement {
            const HTMLSelectElementRef = getScopeHTMLSelectElement(scope);
            return (
                typeof HTMLSelectElementRef === "function" &&
                value instanceof HTMLSelectElementRef
            );
        },
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            const KeyboardEventRef = getScopeKeyboardEvent(scope);
            return (
                typeof KeyboardEventRef === "function" &&
                value instanceof KeyboardEventRef
            );
        },
        queryElement<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return getScopeDocument(scope).querySelector<TElement>(selector);
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
        setTimeout(
            callback: () => void,
            delay: number
        ): SettingsModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "settingsModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}

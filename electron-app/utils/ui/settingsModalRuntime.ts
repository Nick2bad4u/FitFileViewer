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

export interface SettingsModalRuntimeScope {
    readonly getCancelAnimationFrame?:
        | (() => BrowserCancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => BrowserHTMLSelectElementConstructor | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => BrowserKeyboardEventConstructor | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
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

function getScopeCancelAnimationFrame(
    scope: SettingsModalRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: SettingsModalRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeDocument(scope: SettingsModalRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("settingsModalRuntime requires a document runtime");
    }
    return documentRef;
}

function getScopeHTMLElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return scope.getHTMLElement?.();
}

function getScopeHTMLInputElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLInputElementConstructor | undefined {
    return scope.getHTMLInputElement?.();
}

function getScopeHTMLSelectElement(
    scope: SettingsModalRuntimeScope
): BrowserHTMLSelectElementConstructor | undefined {
    return scope.getHTMLSelectElement?.();
}

function getScopeKeyboardEvent(
    scope: SettingsModalRuntimeScope
): BrowserKeyboardEventConstructor | undefined {
    return scope.getKeyboardEvent?.();
}

function getScopeRequestAnimationFrame(
    scope: SettingsModalRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: SettingsModalRuntimeScope
): BrowserSetTimeout | undefined {
    return scope.getSetTimeout?.();
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

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";
import {
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type KeyboardShortcutsModalTimerHandle = BrowserTimerHandle;
type KeyboardShortcutsModalRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface KeyboardShortcutsModalRuntimeScope {
    readonly getCancelAnimationFrame: KeyboardShortcutsModalRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: KeyboardShortcutsModalRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: KeyboardShortcutsModalRuntimeProvider<Document>;
    readonly getHTMLElement: KeyboardShortcutsModalRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getKeyboardEvent: KeyboardShortcutsModalRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getRequestAnimationFrame: KeyboardShortcutsModalRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: KeyboardShortcutsModalRuntimeProvider<BrowserSetTimeout>;
}

export interface KeyboardShortcutsModalRuntime {
    readonly appendToBody: (element: HTMLElement) => void;
    readonly appendToHead: (element: HTMLElement) => void;
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: KeyboardShortcutsModalTimerHandle) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly getActiveElement: () => Element | null;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    readonly querySelector: <K extends Element = Element>(
        selector: string
    ) => K | null;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly setBodyOverflow: (value: string) => void;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => KeyboardShortcutsModalTimerHandle;
}

export const KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const defaultKeyboardShortcutsModalRuntimeScope: KeyboardShortcutsModalRuntimeScope =
    {
        getCancelAnimationFrame: getBrowserCancelAnimationFrame,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getKeyboardEvent: getBrowserKeyboardEvent,
        getRequestAnimationFrame: getBrowserRequestAnimationFrame,
        getSetTimeout: getBrowserSetTimeout,
    };

function getRequiredProvider<T>(
    provider: KeyboardShortcutsModalRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `keyboardShortcutsModalRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getScopeCancelAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    )();
}

function getScopeClearTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getScopeDocument(scope: KeyboardShortcutsModalRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getScopeHTMLElement(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "keyboardShortcutsModalRuntime requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getScopeKeyboardEvent(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserKeyboardEventConstructor {
    const KeyboardEventConstructor = getRequiredProvider(
        scope.getKeyboardEvent,
        "KeyboardEvent"
    )();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError(
            "keyboardShortcutsModalRuntime requires a KeyboardEvent runtime"
        );
    }

    return KeyboardEventConstructor;
}

function getScopeRequestAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    )();
}

function getScopeSetTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: KeyboardShortcutsModalRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getScopeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getKeyboardShortcutsModalRuntime(
    scope: KeyboardShortcutsModalRuntimeScope = defaultKeyboardShortcutsModalRuntimeScope
): KeyboardShortcutsModalRuntime {
    return {
        appendToBody(element): void {
            getScopeDocument(scope).body.append(element);
        },
        appendToHead(element): void {
            getScopeDocument(scope).head.append(element);
        },
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        createElement(tagName) {
            return getScopeDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        getActiveElement(): Element | null {
            return getScopeDocument(scope).activeElement;
        },
        isHTMLElement(value): value is HTMLElement {
            return value instanceof getScopeHTMLElement(scope);
        },
        isKeyboardEvent(value): value is KeyboardEvent {
            return value instanceof getScopeKeyboardEvent(scope);
        },
        querySelector<K extends Element = Element>(selector: string): K | null {
            return getScopeDocument(scope).querySelector<K>(selector);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        setBodyOverflow(value): void {
            getScopeDocument(scope).body.style.overflow = value;
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): KeyboardShortcutsModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}

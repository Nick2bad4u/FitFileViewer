export type SettingsModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface SettingsModalRuntimeScope {
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => typeof globalThis.HTMLSelectElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getHTMLInputElement: () => globalThis.HTMLInputElement,
    getHTMLSelectElement: () => globalThis.HTMLSelectElement,
    getKeyboardEvent: () => globalThis.KeyboardEvent,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeCancelAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
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
): typeof globalThis.HTMLElement | undefined {
    return scope.getHTMLElement?.();
}

function getScopeHTMLInputElement(
    scope: SettingsModalRuntimeScope
): typeof globalThis.HTMLInputElement | undefined {
    return scope.getHTMLInputElement?.();
}

function getScopeHTMLSelectElement(
    scope: SettingsModalRuntimeScope
): typeof globalThis.HTMLSelectElement | undefined {
    return scope.getHTMLSelectElement?.();
}

function getScopeKeyboardEvent(
    scope: SettingsModalRuntimeScope
): typeof globalThis.KeyboardEvent | undefined {
    return scope.getKeyboardEvent?.();
}

function getScopeRequestAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
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
            return getScopeDocument(scope).createElementNS(
                "http://www.w3.org/2000/svg",
                tagName
            );
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

export type RenderTableTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type RenderTableClearTimeout = (handle: RenderTableTimerHandle) => void;
type RenderTableGetComputedStyle = (
    element: Element,
    pseudoElement?: null | string
) => CSSStyleDeclaration;
type RenderTableRequestAnimationFrame = (
    callback: FrameRequestCallback
) => number;
type RenderTableSetTimeout = (
    callback: () => void,
    timeout?: number
) => RenderTableTimerHandle;

export interface RenderTableRuntimeScope {
    readonly clearTimeout?: RenderTableClearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly getClearTimeout?:
        | (() => RenderTableClearTimeout | undefined)
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => RenderTableGetComputedStyle | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getHTMLTableCellElement?:
        | (() => typeof HTMLTableCellElement | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => RenderTableRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => RenderTableSetTimeout | undefined)
        | undefined;
    readonly getComputedStyle?: RenderTableGetComputedStyle | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly HTMLTableCellElement?: typeof HTMLTableCellElement | undefined;
    readonly requestAnimationFrame?:
        | RenderTableRequestAnimationFrame
        | undefined;
    readonly setTimeout?: RenderTableSetTimeout | undefined;
}

export interface RenderTableRuntime {
    clearTimeout: (handle: RenderTableTimerHandle) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getComputedStyle: (element: Element) => CSSStyleDeclaration | undefined;
    getElementById: (id: string) => HTMLElement | null;
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    isTableCellElement: (
        element: Element | null
    ) => element is HTMLTableCellElement;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => RenderTableTimerHandle;
}

function getDocument(scope: RenderTableRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.() ?? scope.document;
    if (!runtimeDocument) {
        throw new Error("renderTable requires a document-like runtime");
    }

    return runtimeDocument;
}

function getRequiredClearTimeout(
    scope: RenderTableRuntimeScope
): RenderTableClearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.() ?? scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getScopeGetComputedStyle(
    scope: RenderTableRuntimeScope
): RenderTableGetComputedStyle | undefined {
    return scope.getComputedStyleFunction?.() ?? scope.getComputedStyle;
}

function getScopeHTMLElement(
    scope: RenderTableRuntimeScope
): typeof HTMLElement | undefined {
    return scope.getHTMLElement?.() ?? scope.HTMLElement;
}

function getScopeHTMLTableCellElement(
    scope: RenderTableRuntimeScope
): typeof HTMLTableCellElement | undefined {
    return scope.getHTMLTableCellElement?.() ?? scope.HTMLTableCellElement;
}

function getScopeRequestAnimationFrame(
    scope: RenderTableRuntimeScope
): RenderTableRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

function getRequiredSetTimeout(
    scope: RenderTableRuntimeScope
): RenderTableSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.() ?? scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultRenderTableRuntimeScope: RenderTableRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getComputedStyleFunction: () => globalThis.getComputedStyle,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getHTMLTableCellElement: () => globalThis.HTMLTableCellElement,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getRenderTableRuntime(
    scope: RenderTableRuntimeScope = defaultRenderTableRuntimeScope
): RenderTableRuntime {
    return {
        clearTimeout(handle: RenderTableTimerHandle): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef.call(scope, handle);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        getComputedStyle(element: Element): CSSStyleDeclaration | undefined {
            const getComputedStyleRef = getScopeGetComputedStyle(scope);
            if (typeof getComputedStyleRef !== "function") {
                return undefined;
            }

            return getComputedStyleRef.call(scope, element);
        },
        getElementById(id: string): HTMLElement | null {
            const element = getDocument(scope).getElementById(id);
            return this.isHTMLElement(element) ? element : null;
        },
        isHTMLElement(element: Element | null): element is HTMLElement {
            const HTMLElementConstructor = getScopeHTMLElement(scope);
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        isTableCellElement(
            element: Element | null
        ): element is HTMLTableCellElement {
            const TableCellConstructor = getScopeHTMLTableCellElement(scope);
            return (
                typeof TableCellConstructor === "function" &&
                element instanceof TableCellConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return undefined;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): RenderTableTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef.call(scope, callback, timeout);
        },
    };
}

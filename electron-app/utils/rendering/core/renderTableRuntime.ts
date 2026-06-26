import {
    getBrowserClearTimeout,
    getBrowserComputedStyle,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLTableCellElement,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type RenderTableTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type RenderTableClearTimeout = (handle: RenderTableTimerHandle) => void;
type RenderTableGetComputedStyle = (
    element: Readonly<Element>,
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
}

export interface RenderTableRuntime {
    readonly clearTimeout: (handle: RenderTableTimerHandle) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly getComputedStyle: (
        element: Readonly<Element>
    ) => CSSStyleDeclaration | undefined;
    readonly getElementById: (id: string) => HTMLElement | null;
    readonly isHTMLElement: (
        element: Readonly<Element> | null
    ) => element is HTMLElement;
    readonly isTableCellElement: (
        element: Readonly<Element> | null
    ) => element is HTMLTableCellElement;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => RenderTableTimerHandle;
}

function getDocument(scope: RenderTableRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new Error("renderTable requires a document-like runtime");
    }

    return runtimeDocument;
}

function getRequiredClearTimeout(
    scope: RenderTableRuntimeScope
): RenderTableClearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getScopeGetComputedStyle(
    scope: RenderTableRuntimeScope
): RenderTableGetComputedStyle | undefined {
    return scope.getComputedStyleFunction?.();
}

function getScopeHTMLElement(
    scope: RenderTableRuntimeScope
): typeof HTMLElement | undefined {
    return scope.getHTMLElement?.();
}

function getScopeHTMLTableCellElement(
    scope: RenderTableRuntimeScope
): typeof HTMLTableCellElement | undefined {
    return scope.getHTMLTableCellElement?.();
}

function getScopeRequestAnimationFrame(
    scope: RenderTableRuntimeScope
): RenderTableRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getRequiredSetTimeout(
    scope: RenderTableRuntimeScope
): RenderTableSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultRenderTableRuntimeScope: RenderTableRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getComputedStyleFunction: getBrowserComputedStyle,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getHTMLTableCellElement: getBrowserHTMLTableCellElement,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
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
        getComputedStyle(
            element: Readonly<Element>
        ): CSSStyleDeclaration | undefined {
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
        isHTMLElement(
            element: Readonly<Element> | null
        ): element is HTMLElement {
            const HTMLElementConstructor = getScopeHTMLElement(scope);
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        isTableCellElement(
            element: Readonly<Element> | null
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

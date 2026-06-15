export type RenderTableTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface RenderTableRuntimeScope {
    readonly clearTimeout?:
        | ((handle: RenderTableTimerHandle) => void)
        | undefined;
    readonly document?: Document | undefined;
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly HTMLTableCellElement?: typeof HTMLTableCellElement | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => number)
        | undefined;
    readonly setTimeout?:
        | ((callback: () => void, timeout?: number) => RenderTableTimerHandle)
        | undefined;
}

export interface RenderTableRuntime {
    clearTimeout: (handle: RenderTableTimerHandle) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getComputedStyle: (element: Element) => CSSStyleDeclaration | undefined;
    getElementById: (id: string) => HTMLElement | null;
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    isTableCellElement: (element: Element | null) => element is HTMLTableCellElement;
    requestAnimationFrame: (callback: FrameRequestCallback) => number | undefined;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => RenderTableTimerHandle;
}

function getDocument(scope: RenderTableRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new Error("renderTable requires a document-like runtime");
    }

    return runtimeDocument;
}

function getRequiredClearTimeout(
    scope: RenderTableRuntimeScope
): (handle: RenderTableTimerHandle) => void {
    const clearTimeoutRef = scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getRequiredSetTimeout(
    scope: RenderTableRuntimeScope
): (callback: () => void, timeout?: number) => RenderTableTimerHandle {
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("renderTable requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultRenderTableRuntimeScope: RenderTableRuntimeScope = globalThis;

export function getRenderTableRuntime(
    scope: RenderTableRuntimeScope = defaultRenderTableRuntimeScope
): RenderTableRuntime {
    return {
        clearTimeout(handle: RenderTableTimerHandle): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef(handle);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        getComputedStyle(element: Element): CSSStyleDeclaration | undefined {
            if (typeof scope.getComputedStyle !== "function") {
                return undefined;
            }

            return scope.getComputedStyle(element);
        },
        getElementById(id: string): HTMLElement | null {
            const element = getDocument(scope).getElementById(id);
            return this.isHTMLElement(element) ? element : null;
        },
        isHTMLElement(element: Element | null): element is HTMLElement {
            const HTMLElementConstructor = scope.HTMLElement;
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        isTableCellElement(
            element: Element | null
        ): element is HTMLTableCellElement {
            const TableCellConstructor = scope.HTMLTableCellElement;
            return (
                typeof TableCellConstructor === "function" &&
                element instanceof TableCellConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): RenderTableTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, timeout);
        },
    };
}

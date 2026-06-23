import { getIconFactoryRuntime } from "./icons/iconFactoryRuntime.js";

export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type QuickColorSwitcherSetTimeout = (
    callback: () => void,
    timeout: number
) => QuickColorSwitcherTimerHandle;

type QuickColorSwitcherClickListener = (event: Readonly<MouseEvent>) => void;

type QuickColorSwitcherListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;

export interface QuickColorSwitcherRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getNode?: (() => typeof globalThis.Node | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => QuickColorSwitcherSetTimeout | undefined)
        | undefined;
}

export interface QuickColorSwitcherRuntime {
    addDocumentClickListener: (
        listener: QuickColorSwitcherClickListener,
        options: QuickColorSwitcherListenerOptions
    ) => void;
    clearTimeout: (handle: QuickColorSwitcherTimerHandle) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    createAbortController: () => AbortController;
    createTextNode: (data: string) => Text;
    appendToBody: (node: Node) => void;
    appendToHead: (node: Node) => void;
    isNode: (value: unknown) => value is Node;
    querySelector: <TElement extends Element = Element>(
        selectors: string
    ) => TElement | null;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => QuickColorSwitcherTimerHandle;
}

const defaultQuickColorSwitcherRuntimeScope: QuickColorSwitcherRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getNode: () => globalThis.Node,
    getSetTimeout: () => globalThis.setTimeout,
};

function getAbortControllerConstructor(
    scope: QuickColorSwitcherRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getClearTimeout(
    scope: QuickColorSwitcherRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getDocument(
    scope: QuickColorSwitcherRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getRequiredDocument(scope: QuickColorSwitcherRuntimeScope): Document {
    const runtimeDocument = getDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError("quickColorSwitcher requires a document runtime");
    }

    return runtimeDocument;
}

function getNodeConstructor(
    scope: QuickColorSwitcherRuntimeScope
): typeof globalThis.Node | undefined {
    return scope.getNode?.();
}

function getSetTimeout(
    scope: QuickColorSwitcherRuntimeScope
): QuickColorSwitcherSetTimeout | undefined {
    return scope.getSetTimeout?.();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: QuickColorSwitcherRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRequiredDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = defaultQuickColorSwitcherRuntimeScope
): QuickColorSwitcherRuntime {
    return {
        addDocumentClickListener(
            listener: QuickColorSwitcherClickListener,
            options: QuickColorSwitcherListenerOptions
        ): void {
            const runtimeDocument = getDocument(scope);
            if (!runtimeDocument) {
                throw new TypeError(
                    "quickColorSwitcher requires a document runtime"
                );
            }

            runtimeDocument.addEventListener("click", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createTextNode(data: string): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        appendToBody(node: Node): void {
            getRequiredDocument(scope).body.append(node);
        },
        appendToHead(node: Node): void {
            getRequiredDocument(scope).head.append(node);
        },
        isNode(value: unknown): value is Node {
            const NodeConstructor = getNodeConstructor(scope);
            return (
                typeof NodeConstructor === "function" &&
                value instanceof NodeConstructor
            );
        },
        querySelector<TElement extends Element = Element>(
            selectors: string
        ): TElement | null {
            return getRequiredDocument(scope).querySelector<TElement>(
                selectors
            );
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}

import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserNodeConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserNode,
    getBrowserSetTimeout,
} from "../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "./icons/iconFactoryRuntime.js";

export type QuickColorSwitcherTimerHandle = BrowserTimerHandle | number;

type QuickColorSwitcherClickListener = (event: Readonly<MouseEvent>) => void;

type QuickColorSwitcherListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;
type QuickColorSwitcherRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface QuickColorSwitcherRuntimeScope {
    readonly getAbortController: QuickColorSwitcherRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: QuickColorSwitcherRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: QuickColorSwitcherRuntimeProvider<Document>;
    readonly getNode: QuickColorSwitcherRuntimeProvider<BrowserNodeConstructor>;
    readonly getSetTimeout: QuickColorSwitcherRuntimeProvider<BrowserSetTimeout>;
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
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getNode: getBrowserNode,
    getSetTimeout: getBrowserSetTimeout,
};

function getAbortControllerConstructor(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor | undefined {
    return getAbortController();
}

function getClearTimeout(
    getClearTimeoutRef: () => BrowserClearTimeout | undefined
): BrowserClearTimeout | undefined {
    return getClearTimeoutRef();
}

function getDocument(
    getDocumentRef: () => Document | undefined
): Document | undefined {
    return getDocumentRef();
}

function getRequiredDocument(
    getDocumentRef: () => Document | undefined
): Document {
    const runtimeDocument = getDocument(getDocumentRef);
    if (!runtimeDocument) {
        throw new TypeError("quickColorSwitcher requires a document runtime");
    }

    return runtimeDocument;
}

function getNodeConstructor(
    getNode: () => BrowserNodeConstructor | undefined
): BrowserNodeConstructor | undefined {
    return getNode();
}

function getSetTimeout(
    getSetTimeoutRef: () => BrowserSetTimeout | undefined
): BrowserSetTimeout | undefined {
    return getSetTimeoutRef();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    getDocumentRef: () => Document | undefined,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRequiredDocument(getDocumentRef);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = defaultQuickColorSwitcherRuntimeScope
): QuickColorSwitcherRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getClearTimeoutRef = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout"
    );
    const getDocumentRef = getRequiredProvider(scope.getDocument, "a document");
    const getNode = getRequiredProvider(scope.getNode, "a Node");
    const getSetTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout"
    );

    return {
        addDocumentClickListener(
            listener: QuickColorSwitcherClickListener,
            options: QuickColorSwitcherListenerOptions
        ): void {
            const runtimeDocument = getDocument(getDocumentRef);
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
            const clearTimeoutRef = getClearTimeout(getClearTimeoutRef);
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
            return getRequiredDocument(getDocumentRef).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(getDocumentRef, tagName);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(getAbortController);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createTextNode(data: string): Text {
            return getRequiredDocument(getDocumentRef).createTextNode(data);
        },
        appendToBody(node: Node): void {
            getRequiredDocument(getDocumentRef).body.append(node);
        },
        appendToHead(node: Node): void {
            getRequiredDocument(getDocumentRef).head.append(node);
        },
        isNode(value: unknown): value is Node {
            const NodeConstructor = getNodeConstructor(getNode);
            return (
                typeof NodeConstructor === "function" &&
                value instanceof NodeConstructor
            );
        },
        querySelector<TElement extends Element = Element>(
            selectors: string
        ): TElement | null {
            return getRequiredDocument(getDocumentRef).querySelector<TElement>(
                selectors
            );
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = getSetTimeout(getSetTimeoutRef);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}

function getRequiredProvider<T>(
    provider: QuickColorSwitcherRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `quickColorSwitcher requires ${providerLabel} provider`
        );
    }

    return provider;
}

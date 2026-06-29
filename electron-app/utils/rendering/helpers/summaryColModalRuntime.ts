import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserKeyboardEventConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserMouseEvent,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

type SummaryColModalRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface SummaryColModalRuntimeScope {
    readonly getAbortController: SummaryColModalRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: SummaryColModalRuntimeProvider<Document>;
    readonly getHTMLElement: SummaryColModalRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getKeyboardEvent: SummaryColModalRuntimeProvider<BrowserKeyboardEventConstructor>;
    readonly getMouseEvent: SummaryColModalRuntimeProvider<typeof MouseEvent>;
    readonly getViewport: SummaryColModalRuntimeProvider<SummaryColModalViewport>;
}

export interface SummaryColModalViewport {
    readonly height: number;
    readonly width: number;
}

export interface SummaryColModalRuntime {
    readonly appendToBody: (node: Node) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createTextNode: (data: string) => Text;
    readonly getActiveElement: () => HTMLElement | null;
    readonly getViewport: () => SummaryColModalViewport;
    readonly isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    readonly isMouseEvent: (value: unknown) => value is MouseEvent;
}

const defaultSummaryColModalRuntimeScope: SummaryColModalRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getKeyboardEvent: getBrowserKeyboardEvent,
    getMouseEvent: getBrowserMouseEvent,
    getViewport: getBrowserViewport,
};

function getRequiredProvider<T>(
    provider: SummaryColModalRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (provider === undefined) {
        throw new TypeError(
            `summaryColModal requires ${providerName} provider`
        );
    }

    return provider;
}

export function getSummaryColModalRuntime(
    scope: SummaryColModalRuntimeScope = defaultSummaryColModalRuntimeScope
): SummaryColModalRuntime {
    return {
        appendToBody(node): void {
            getRuntimeDocument(scope).body.append(node);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getRequiredProvider(
                scope.getAbortController,
                "AbortController"
            )();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "summaryColModal requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRuntimeDocument(scope).createElement(tagName);
        },
        createTextNode(data) {
            return getRuntimeDocument(scope).createTextNode(data);
        },
        getActiveElement(): HTMLElement | null {
            const activeElement = getRuntimeDocument(scope).activeElement;
            const HTMLElementConstructor = getRequiredProvider(
                scope.getHTMLElement,
                "HTMLElement"
            )();
            if (
                typeof HTMLElementConstructor !== "function" ||
                !(activeElement instanceof HTMLElementConstructor)
            ) {
                return null;
            }

            return activeElement;
        },
        getViewport(): SummaryColModalViewport {
            return (
                getRequiredProvider(scope.getViewport, "viewport")() ?? {
                    height: 0,
                    width: 0,
                }
            );
        },
        isKeyboardEvent(value): value is KeyboardEvent {
            return value instanceof getKeyboardEventConstructor(scope);
        },
        isMouseEvent(value): value is MouseEvent {
            return value instanceof getMouseEventConstructor(scope);
        },
    };
}

function getRuntimeDocument(scope: SummaryColModalRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("summaryColModal requires a document runtime");
    }

    return runtimeDocument;
}

function getKeyboardEventConstructor(
    scope: SummaryColModalRuntimeScope
): BrowserKeyboardEventConstructor {
    const KeyboardEventConstructor = getRequiredProvider(
        scope.getKeyboardEvent,
        "KeyboardEvent"
    )();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError("summaryColModal requires a KeyboardEvent runtime");
    }

    return KeyboardEventConstructor;
}

function getMouseEventConstructor(
    scope: SummaryColModalRuntimeScope
): typeof MouseEvent {
    const MouseEventConstructor = getRequiredProvider(
        scope.getMouseEvent,
        "MouseEvent"
    )();
    if (typeof MouseEventConstructor !== "function") {
        throw new TypeError("summaryColModal requires a MouseEvent runtime");
    }

    return MouseEventConstructor;
}

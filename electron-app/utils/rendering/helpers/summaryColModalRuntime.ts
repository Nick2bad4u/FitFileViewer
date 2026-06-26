import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserKeyboardEvent,
    getBrowserMouseEvent,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

export interface SummaryColModalRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof KeyboardEvent | undefined)
        | undefined;
    readonly getMouseEvent?: (() => typeof MouseEvent | undefined) | undefined;
    readonly getViewport?:
        | (() => SummaryColModalViewport | undefined)
        | undefined;
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

export function getSummaryColModalRuntime(
    scope: SummaryColModalRuntimeScope = defaultSummaryColModalRuntimeScope
): SummaryColModalRuntime {
    return {
        appendToBody(node): void {
            getRuntimeDocument(scope).body.append(node);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
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
            const HTMLElementConstructor = scope.getHTMLElement?.();
            if (
                typeof HTMLElementConstructor !== "function" ||
                !(activeElement instanceof HTMLElementConstructor)
            ) {
                return null;
            }

            return activeElement;
        },
        getViewport(): SummaryColModalViewport {
            return scope.getViewport?.() ?? { height: 0, width: 0 };
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
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("summaryColModal requires a document runtime");
    }

    return runtimeDocument;
}

function getKeyboardEventConstructor(
    scope: SummaryColModalRuntimeScope
): typeof KeyboardEvent {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError("summaryColModal requires a KeyboardEvent runtime");
    }

    return KeyboardEventConstructor;
}

function getMouseEventConstructor(
    scope: SummaryColModalRuntimeScope
): typeof MouseEvent {
    const MouseEventConstructor = scope.getMouseEvent?.();
    if (typeof MouseEventConstructor !== "function") {
        throw new TypeError("summaryColModal requires a MouseEvent runtime");
    }

    return MouseEventConstructor;
}

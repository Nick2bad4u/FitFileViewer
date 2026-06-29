import {
    type BrowserElementConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserElement,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface TabDocumentRuntimeScope {
    readonly getDocument: (() => unknown) | undefined;
    readonly getElement:
        | (() => BrowserElementConstructor | undefined)
        | undefined;
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

export interface TabDocumentRuntime {
    getDocument: (testDocument?: Readonly<Document>) => Document | undefined;
    isElement: (value: unknown) => value is Element;
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

function isDocumentLike(candidate: unknown): candidate is Document {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}

function getScopeDocument(
    scope: TabDocumentRuntimeScope
): Document | undefined {
    const getDocument = scope.getDocument;
    if (!getDocument) {
        throw new TypeError("tabDocumentRuntime requires a document provider");
    }

    try {
        const candidate = getDocument();
        return isDocumentLike(candidate) ? candidate : undefined;
    } catch {
        return undefined;
    }
}

const defaultTabDocumentRuntimeScope: TabDocumentRuntimeScope = {
    getDocument: getBrowserDocument,
    getElement: getBrowserElement,
    getHTMLElement: getBrowserHTMLElement,
};

function getElementConstructor(
    scope: TabDocumentRuntimeScope
): BrowserElementConstructor {
    const getElement = scope.getElement;
    if (!getElement) {
        throw new TypeError("tabDocumentRuntime requires an Element provider");
    }

    const ElementConstructor = getElement();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError("tabDocumentRuntime requires an Element runtime");
    }

    return ElementConstructor;
}

function getHTMLElementConstructor(
    scope: TabDocumentRuntimeScope
): BrowserHTMLElementConstructor {
    const getHTMLElement = scope.getHTMLElement;
    if (!getHTMLElement) {
        throw new TypeError(
            "tabDocumentRuntime requires an HTMLElement provider"
        );
    }

    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "tabDocumentRuntime requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

export function getTabDocumentRuntime(
    scope: TabDocumentRuntimeScope = defaultTabDocumentRuntimeScope
): TabDocumentRuntime {
    return {
        getDocument(testDocument?: Readonly<Document>): Document | undefined {
            if (isDocumentLike(testDocument)) {
                return testDocument;
            }

            const candidates = [getScopeDocument(scope)];

            return candidates.find(isDocumentLike);
        },
        isElement(value: unknown): value is Element {
            return value instanceof getElementConstructor(scope);
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}

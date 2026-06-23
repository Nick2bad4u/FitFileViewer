export interface TabDocumentRuntimeScope {
    readonly getDocument?: (() => unknown) | undefined;
    readonly getElement?:
        | (() => typeof globalThis.Element | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
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
    try {
        const candidate = scope.getDocument?.();
        return isDocumentLike(candidate) ? candidate : undefined;
    } catch {
        return undefined;
    }
}

const defaultTabDocumentRuntimeScope: TabDocumentRuntimeScope = {
    getDocument: () => globalThis.document,
    getElement: () => globalThis.Element,
    getHTMLElement: () => globalThis.HTMLElement,
};

function getElementConstructor(
    scope: TabDocumentRuntimeScope
): typeof globalThis.Element {
    const ElementConstructor = scope.getElement?.();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError("tabDocumentRuntime requires an Element runtime");
    }

    return ElementConstructor;
}

function getHTMLElementConstructor(
    scope: TabDocumentRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
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
            const candidates = [testDocument, getScopeDocument(scope)];

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

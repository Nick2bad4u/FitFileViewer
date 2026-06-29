import {
    type BrowserDOMParserConstructor,
    type BrowserElementConstructor,
    type BrowserNodeFilter,
    getBrowserDocument,
    getBrowserDOMParser,
    getBrowserElement,
    getBrowserNodeFilter,
} from "../runtime/browserRuntime.js";

type SanitizeHtmlAllowlistDocument = Pick<
    Document,
    "createDocumentFragment" | "createTextNode" | "createTreeWalker"
>;

export interface SanitizeHtmlAllowlistRuntimeScope {
    readonly getDocument: () => SanitizeHtmlAllowlistDocument | undefined;
    readonly getDOMParser: () => BrowserDOMParserConstructor | undefined;
    readonly getElement: () => BrowserElementConstructor | undefined;
    readonly getNodeFilter: () => BrowserNodeFilter | undefined;
}

export interface SanitizeHtmlAllowlistRuntime {
    readonly createDocumentFragment: () => DocumentFragment;
    readonly createDomParser: () => DOMParser;
    readonly createElementTreeWalker: (root: Node) => TreeWalker;
    readonly createTextNode: (data: string) => Text;
    readonly isElement: (value: unknown) => value is Element;
}

const defaultSanitizeHtmlAllowlistRuntimeScope: SanitizeHtmlAllowlistRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getDOMParser: getBrowserDOMParser,
        getElement: getBrowserElement,
        getNodeFilter: getBrowserNodeFilter,
    };

function getRequiredDocument(
    scope: SanitizeHtmlAllowlistRuntimeScope
): SanitizeHtmlAllowlistDocument {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a document provider"
        );
    }

    const runtimeDocument = scope.getDocument();
    if (!runtimeDocument) {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getRequiredDOMParser(
    scope: SanitizeHtmlAllowlistRuntimeScope
): BrowserDOMParserConstructor {
    if (typeof scope.getDOMParser !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a DOMParser provider"
        );
    }

    const DOMParserConstructor = scope.getDOMParser();
    if (typeof DOMParserConstructor !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a DOMParser runtime"
        );
    }

    return DOMParserConstructor;
}

function getRequiredNodeFilter(
    scope: SanitizeHtmlAllowlistRuntimeScope
): BrowserNodeFilter {
    if (typeof scope.getNodeFilter !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a NodeFilter provider"
        );
    }

    const NodeFilterRef = scope.getNodeFilter();
    if (!NodeFilterRef) {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a NodeFilter runtime"
        );
    }

    return NodeFilterRef;
}

function getElementConstructor(
    scope: SanitizeHtmlAllowlistRuntimeScope
): BrowserElementConstructor | undefined {
    if (typeof scope.getElement !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires an Element provider"
        );
    }

    return scope.getElement();
}

export function getSanitizeHtmlAllowlistRuntime(
    scope: SanitizeHtmlAllowlistRuntimeScope = defaultSanitizeHtmlAllowlistRuntimeScope
): SanitizeHtmlAllowlistRuntime {
    return {
        createDocumentFragment(): DocumentFragment {
            return getRequiredDocument(scope).createDocumentFragment();
        },
        createDomParser(): DOMParser {
            const DOMParserConstructor = getRequiredDOMParser(scope);
            return new DOMParserConstructor();
        },
        createElementTreeWalker(root: Node): TreeWalker {
            return getRequiredDocument(scope).createTreeWalker(
                root,
                getRequiredNodeFilter(scope).SHOW_ELEMENT
            );
        },
        createTextNode(data: string): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        isElement(value: unknown): value is Element {
            const ElementConstructor = getElementConstructor(scope);
            return (
                typeof ElementConstructor === "function" &&
                value instanceof ElementConstructor
            );
        },
    };
}

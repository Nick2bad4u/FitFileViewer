type SanitizeHtmlAllowlistDocument = Pick<
    Document,
    "createDocumentFragment" | "createTextNode" | "createTreeWalker"
>;

export interface SanitizeHtmlAllowlistRuntimeScope {
    readonly getDocument?:
        | (() => SanitizeHtmlAllowlistDocument | undefined)
        | undefined;
    readonly getDOMParser?:
        | (() => typeof globalThis.DOMParser | undefined)
        | undefined;
    readonly getElement?:
        | (() => typeof globalThis.Element | undefined)
        | undefined;
    readonly getNodeFilter?:
        | (() => typeof globalThis.NodeFilter | undefined)
        | undefined;
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
        getDocument: () => globalThis.document,
        getDOMParser: () => globalThis.DOMParser,
        getElement: () => globalThis.Element,
        getNodeFilter: () => globalThis.NodeFilter,
    };

function getRequiredDocument(
    scope: SanitizeHtmlAllowlistRuntimeScope
): SanitizeHtmlAllowlistDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getRequiredDOMParser(
    scope: SanitizeHtmlAllowlistRuntimeScope
): typeof globalThis.DOMParser {
    const DOMParserConstructor = scope.getDOMParser?.();
    if (typeof DOMParserConstructor !== "function") {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a DOMParser runtime"
        );
    }

    return DOMParserConstructor;
}

function getRequiredNodeFilter(
    scope: SanitizeHtmlAllowlistRuntimeScope
): typeof globalThis.NodeFilter {
    const NodeFilterRef = scope.getNodeFilter?.();
    if (!NodeFilterRef) {
        throw new TypeError(
            "sanitizeHtmlAllowlist requires a NodeFilter runtime"
        );
    }

    return NodeFilterRef;
}

function getElementConstructor(
    scope: SanitizeHtmlAllowlistRuntimeScope
): typeof globalThis.Element | undefined {
    return scope.getElement?.();
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

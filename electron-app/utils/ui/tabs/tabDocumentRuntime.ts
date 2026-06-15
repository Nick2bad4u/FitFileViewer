export interface TabDocumentRuntimeScope {
    readonly document?: unknown;
    readonly getDocument?: (() => unknown) | undefined;
}

export interface TabDocumentRuntime {
    getDocument: (testDocument?: Document) => Document | undefined;
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
        const candidate = scope.getDocument?.() ?? scope.document;
        return isDocumentLike(candidate) ? candidate : undefined;
    } catch {
        return undefined;
    }
}

const defaultTabDocumentRuntimeScope: TabDocumentRuntimeScope = {
    getDocument: () => globalThis.document,
};

export function getTabDocumentRuntime(
    scope: TabDocumentRuntimeScope = defaultTabDocumentRuntimeScope
): TabDocumentRuntime {
    return {
        getDocument(testDocument?: Document): Document | undefined {
            const candidates = [testDocument, getScopeDocument(scope)];

            return candidates.find(isDocumentLike);
        },
    };
}

export interface TabDocumentRuntimeScope {
    readonly document?: unknown;
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
        return isDocumentLike(scope.document) ? scope.document : undefined;
    } catch {
        return undefined;
    }
}

export function getTabDocumentRuntime(
    scope: TabDocumentRuntimeScope = globalThis
): TabDocumentRuntime {
    return {
        getDocument(testDocument?: Document): Document | undefined {
            const candidates = [testDocument, getScopeDocument(scope)];

            return candidates.find(isDocumentLike);
        },
    };
}

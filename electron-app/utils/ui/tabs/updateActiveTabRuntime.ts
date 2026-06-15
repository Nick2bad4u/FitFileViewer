export interface UpdateActiveTabRuntimeScope {
    readonly document?: unknown;
    readonly window?: {
        readonly document?: unknown;
    };
}

export interface UpdateActiveTabRuntime {
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
    scope: UpdateActiveTabRuntimeScope
): Document | undefined {
    try {
        return isDocumentLike(scope.document) ? scope.document : undefined;
    } catch {
        return undefined;
    }
}

function getScopeWindowDocument(
    scope: UpdateActiveTabRuntimeScope
): Document | undefined {
    try {
        return isDocumentLike(scope.window?.document)
            ? scope.window.document
            : undefined;
    } catch {
        return undefined;
    }
}

const defaultUpdateActiveTabRuntimeScope: UpdateActiveTabRuntimeScope =
    globalThis;

export function getUpdateActiveTabRuntime(
    scope: UpdateActiveTabRuntimeScope = defaultUpdateActiveTabRuntimeScope
): UpdateActiveTabRuntime {
    return {
        getDocument(testDocument?: Document): Document | undefined {
            const candidates = [
                testDocument,
                getScopeDocument(scope),
                getScopeWindowDocument(scope),
            ];

            return candidates.find(isDocumentLike);
        },
    };
}

export interface UpdateActiveTabRuntimeScope {
    readonly document?: unknown;
    readonly getDocument?: (() => unknown) | undefined;
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

const defaultUpdateActiveTabRuntimeScope: UpdateActiveTabRuntimeScope = {
    getDocument: () => globalThis.document,
};

function getProviderDocument(
    scope: UpdateActiveTabRuntimeScope
): Document | undefined {
    try {
        const candidate = scope.getDocument?.();

        return isDocumentLike(candidate) ? candidate : undefined;
    } catch {
        return undefined;
    }
}

export function getUpdateActiveTabRuntime(
    scope: UpdateActiveTabRuntimeScope = defaultUpdateActiveTabRuntimeScope
): UpdateActiveTabRuntime {
    return {
        getDocument(testDocument?: Document): Document | undefined {
            const candidates = [
                testDocument,
                getProviderDocument(scope),
                getScopeDocument(scope),
            ];

            return candidates.find(isDocumentLike);
        },
    };
}

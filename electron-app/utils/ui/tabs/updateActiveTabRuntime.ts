export interface UpdateActiveTabRuntimeScope {
    readonly getDocument?: (() => unknown) | undefined;
}

export interface UpdateActiveTabRuntime {
    getDocument: (testDocument?: Readonly<Document>) => Document | undefined;
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
        getDocument(testDocument?: Readonly<Document>): Document | undefined {
            const candidates: readonly unknown[] = [
                testDocument,
                getProviderDocument(scope),
            ];

            return candidates.find(isDocumentLike);
        },
    };
}

export interface UpdateActiveTabRuntimeScope {
    readonly getDocument?: (() => unknown) | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
}

export interface UpdateActiveTabRuntime {
    getDocument: (testDocument?: Readonly<Document>) => Document | undefined;
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
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
    getKeyboardEvent: () => globalThis.KeyboardEvent,
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

function getKeyboardEventConstructor(
    scope: UpdateActiveTabRuntimeScope
): typeof globalThis.KeyboardEvent {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError("updateActiveTab requires a KeyboardEvent runtime");
    }

    return KeyboardEventConstructor;
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
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            return value instanceof getKeyboardEventConstructor(scope);
        },
    };
}

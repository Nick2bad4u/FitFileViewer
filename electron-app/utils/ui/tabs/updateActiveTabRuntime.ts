import {
    type BrowserKeyboardEventConstructor,
    getBrowserDocument,
    getBrowserKeyboardEvent,
} from "../../runtime/browserRuntime.js";

export interface UpdateActiveTabRuntimeScope {
    readonly getDocument: (() => unknown) | undefined;
    readonly getKeyboardEvent:
        | (() => BrowserKeyboardEventConstructor | undefined)
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
    getDocument: getBrowserDocument,
    getKeyboardEvent: getBrowserKeyboardEvent,
};

function getProviderDocument(
    scope: UpdateActiveTabRuntimeScope
): Document | undefined {
    const getDocument = scope.getDocument;
    if (!getDocument) {
        throw new TypeError("updateActiveTab requires a document provider");
    }

    try {
        const candidate = getDocument();

        return isDocumentLike(candidate) ? candidate : undefined;
    } catch {
        return undefined;
    }
}

function getKeyboardEventConstructor(
    scope: UpdateActiveTabRuntimeScope
): BrowserKeyboardEventConstructor {
    const getKeyboardEvent = scope.getKeyboardEvent;
    if (!getKeyboardEvent) {
        throw new TypeError(
            "updateActiveTab requires a KeyboardEvent provider"
        );
    }

    const KeyboardEventConstructor = getKeyboardEvent();
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
            if (isDocumentLike(testDocument)) {
                return testDocument;
            }

            const candidates: readonly unknown[] = [getProviderDocument(scope)];

            return candidates.find(isDocumentLike);
        },
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            return value instanceof getKeyboardEventConstructor(scope);
        },
    };
}

import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type ShowUpdateNotificationDocument = Pick<
    Document,
    "createElement" | "querySelector"
>;

export interface ShowUpdateNotificationRuntimeScope {
    readonly getDocument:
        | (() => ShowUpdateNotificationDocument | undefined)
        | undefined;
}

export interface ShowUpdateNotificationRuntime {
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly queryNotificationElement: (selector: string) => HTMLElement | null;
}

const defaultShowUpdateNotificationRuntimeScope: ShowUpdateNotificationRuntimeScope =
    {
        getDocument: getBrowserDocument,
    };

function getRequiredDocument(
    scope: ShowUpdateNotificationRuntimeScope
): ShowUpdateNotificationDocument {
    const runtimeDocument = getRequiredDocumentProvider(scope)();
    if (!runtimeDocument) {
        throw new TypeError(
            "showUpdateNotification requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getRequiredDocumentProvider(
    scope: ShowUpdateNotificationRuntimeScope
): () => ShowUpdateNotificationDocument | undefined {
    const getDocument = scope.getDocument;
    if (!getDocument) {
        throw new TypeError(
            "showUpdateNotification requires a document provider"
        );
    }

    return getDocument;
}

export function getShowUpdateNotificationRuntime(
    scope: ShowUpdateNotificationRuntimeScope = defaultShowUpdateNotificationRuntimeScope
): ShowUpdateNotificationRuntime {
    return {
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },
        queryNotificationElement(selector): HTMLElement | null {
            return getRequiredDocument(scope).querySelector<HTMLElement>(
                selector
            );
        },
    };
}

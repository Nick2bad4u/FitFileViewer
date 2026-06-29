import { getBrowserDocument } from "../../runtime/browserRuntime.js";
import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";

export interface SyncRendererNotificationsRuntimeScope {
    readonly getDocument: (() => Document | undefined) | undefined;
}

export interface SyncRendererNotificationsRuntime {
    readonly getNotificationElement: () => HTMLElement | null;
}

const defaultSyncRendererNotificationsRuntimeScope: SyncRendererNotificationsRuntimeScope =
    {
        getDocument: getBrowserDocument,
    };

function getRequiredDocumentProvider(
    scope: SyncRendererNotificationsRuntimeScope
): () => Document | undefined {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "syncRendererNotifications requires a document provider"
        );
    }

    return scope.getDocument;
}

export function getSyncRendererNotificationsRuntime(
    scope: SyncRendererNotificationsRuntimeScope = defaultSyncRendererNotificationsRuntimeScope
): SyncRendererNotificationsRuntime {
    const getDocument = getRequiredDocumentProvider(scope);

    return {
        getNotificationElement(): HTMLElement | null {
            const documentRef = getDocument();
            if (!documentRef) {
                throw new TypeError(
                    "syncRendererNotifications requires a document runtime"
                );
            }

            return querySelectorByIdFlexible(documentRef, "#notification");
        },
    };
}

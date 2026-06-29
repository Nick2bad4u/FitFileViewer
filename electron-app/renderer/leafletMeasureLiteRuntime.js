import { getBrowserDocument } from "../utils/runtime/browserRuntime.js";

const defaultLeafletMeasureLiteRuntimeScope = {
    getDocument: getBrowserDocument,
    getDocumentEventTarget: getBrowserDocument,
};

function getDocumentEventTarget(getDocumentEventTargetProvider, getDocument) {
    return getDocumentEventTargetProvider() ?? getDocument();
}

function getRequiredDocumentEventTarget(
    getDocumentEventTargetProvider,
    getDocument
) {
    const documentEventTarget = getDocumentEventTarget(
        getDocumentEventTargetProvider,
        getDocument
    );
    if (documentEventTarget === undefined || documentEventTarget === null) {
        throw new TypeError(
            "leafletMeasureLite requires a document event-target runtime"
        );
    }

    return documentEventTarget;
}

export function getLeafletMeasureLiteRuntime(
    scope = defaultLeafletMeasureLiteRuntimeScope
) {
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getDocumentEventTargetProvider = getRequiredProvider(
        scope.getDocumentEventTarget,
        "document event-target"
    );

    return {
        addDocumentKeydownListener(listener) {
            getRequiredDocumentEventTarget(
                getDocumentEventTargetProvider,
                getDocument
            ).addEventListener("keydown", listener);
        },
        removeDocumentKeydownListener(listener) {
            getRequiredDocumentEventTarget(
                getDocumentEventTargetProvider,
                getDocument
            ).removeEventListener("keydown", listener);
        },
    };
}

function getRequiredProvider(provider, providerLabel) {
    if (typeof provider !== "function") {
        throw new TypeError(
            `leafletMeasureLite requires ${providerLabel} provider`
        );
    }

    return provider;
}

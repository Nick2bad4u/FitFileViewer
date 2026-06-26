import { getBrowserDocument } from "../utils/runtime/browserRuntime.js";

const defaultLeafletMeasureLiteRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getDocumentEventTarget(scope) {
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getRequiredDocumentEventTarget(scope) {
    const documentEventTarget = getDocumentEventTarget(scope);
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
    return {
        addDocumentKeydownListener(listener) {
            getRequiredDocumentEventTarget(scope).addEventListener(
                "keydown",
                listener
            );
        },
        removeDocumentKeydownListener(listener) {
            getRequiredDocumentEventTarget(scope).removeEventListener(
                "keydown",
                listener
            );
        },
    };
}

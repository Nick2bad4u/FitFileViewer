export interface CreatePowerEstimationButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
}

export interface CreatePowerEstimationButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
}

const defaultCreatePowerEstimationButtonRuntimeScope: CreatePowerEstimationButtonRuntimeScope =
    {
        get AbortController() {
            return globalThis.AbortController;
        },
        get document() {
            return globalThis.document;
        },
    };

function getAbortControllerConstructor(
    scope: CreatePowerEstimationButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerEstimationButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: CreatePowerEstimationButtonRuntimeScope
): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "createPowerEstimationButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getCreatePowerEstimationButtonRuntime(
    scope: CreatePowerEstimationButtonRuntimeScope = defaultCreatePowerEstimationButtonRuntimeScope
): CreatePowerEstimationButtonRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createButton(): HTMLButtonElement {
            return getDocument(scope).createElement("button");
        },
    };
}

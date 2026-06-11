export interface CreatePowerEstimationButtonRuntimeScope {
    readonly document?: Document | undefined;
}

export interface CreatePowerEstimationButtonRuntime {
    createButton: () => HTMLButtonElement;
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
    scope: CreatePowerEstimationButtonRuntimeScope = globalThis
): CreatePowerEstimationButtonRuntime {
    return {
        createButton(): HTMLButtonElement {
            return getDocument(scope).createElement("button");
        },
    };
}

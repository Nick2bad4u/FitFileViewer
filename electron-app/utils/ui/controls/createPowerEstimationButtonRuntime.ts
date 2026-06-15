export interface CreatePowerEstimationButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface CreatePowerEstimationButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
}

const defaultCreatePowerEstimationButtonRuntimeScope: CreatePowerEstimationButtonRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
    };

function getScopeDocument(
    scope: CreatePowerEstimationButtonRuntimeScope
): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getAbortControllerConstructor(
    scope: CreatePowerEstimationButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        scope.AbortController ??
        getScopeDocument(scope)?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerEstimationButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreatePowerEstimationButtonRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
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

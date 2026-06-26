import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

export interface CreatePowerEstimationButtonRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface CreatePowerEstimationButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
}

const defaultCreatePowerEstimationButtonRuntimeScope: CreatePowerEstimationButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
    };

function getScopeDocument(
    scope: CreatePowerEstimationButtonRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: CreatePowerEstimationButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
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

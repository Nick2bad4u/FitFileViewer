import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

export interface CreatePowerEstimationButtonRuntimeScope {
    readonly getAbortController: CreatePowerEstimationButtonRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: CreatePowerEstimationButtonRuntimeProvider<Document>;
}

type CreatePowerEstimationButtonRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreatePowerEstimationButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
}

const defaultCreatePowerEstimationButtonRuntimeScope: CreatePowerEstimationButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
    };

function getRequiredProvider<T>(
    provider: CreatePowerEstimationButtonRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createPowerEstimationButton requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreatePowerEstimationButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerEstimationButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreatePowerEstimationButtonRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
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

import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserQueueMicrotask,
} from "../../runtime/browserRuntime.js";

export interface CreateDataPointFilterControlRuntimeScope {
    readonly getAbortController: CreateDataPointFilterControlRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: CreateDataPointFilterControlRuntimeProvider<Document>;
    readonly getQueueMicrotask: CreateDataPointFilterControlRuntimeProvider<
        typeof queueMicrotask
    >;
}

type CreateDataPointFilterControlRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreateDataPointFilterControlRuntime {
    createAbortController: () => AbortController;
    createOption: () => HTMLOptionElement;
    scheduleMicrotask: (callback: VoidFunction) => void;
}

const defaultCreateDataPointFilterControlRuntimeScope: CreateDataPointFilterControlRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getQueueMicrotask: getBrowserQueueMicrotask,
    };

function getRequiredProvider<T>(
    provider: CreateDataPointFilterControlRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createDataPointFilterControl requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateDataPointFilterControlRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createDataPointFilterControl requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: CreateDataPointFilterControlRuntimeScope
): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "createDataPointFilterControl requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getCreateDataPointFilterControlRuntime(
    scope: CreateDataPointFilterControlRuntimeScope = defaultCreateDataPointFilterControlRuntimeScope
): CreateDataPointFilterControlRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            return new AbortControllerConstructor();
        },
        createOption(): HTMLOptionElement {
            return getDocument(scope).createElement("option");
        },
        scheduleMicrotask(callback: VoidFunction): void {
            const microtaskScheduler = getRequiredProvider(
                scope.getQueueMicrotask,
                "queueMicrotask"
            )();
            if (typeof microtaskScheduler === "function") {
                microtaskScheduler(callback);
                return;
            }

            // eslint-disable-next-line promise/no-callback-in-promise, promise/prefer-await-to-then -- Preserve the existing Promise microtask fallback when queueMicrotask is unavailable.
            void Promise.resolve().then(callback);
        },
    };
}

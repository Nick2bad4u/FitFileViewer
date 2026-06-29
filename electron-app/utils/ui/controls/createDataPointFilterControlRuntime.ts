import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserQueueMicrotask,
} from "../../runtime/browserRuntime.js";

export interface CreateDataPointFilterControlRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getQueueMicrotask:
        | (() => typeof queueMicrotask | undefined)
        | undefined;
}

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

function getAbortControllerConstructor(
    scope: CreateDataPointFilterControlRuntimeScope
): BrowserAbortControllerConstructor {
    const getRuntimeAbortController = scope.getAbortController;
    if (typeof getRuntimeAbortController !== "function") {
        throw new TypeError(
            "createDataPointFilterControl requires an AbortController provider"
        );
    }

    const AbortControllerConstructor = getRuntimeAbortController();
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
    const getRuntimeDocument = scope.getDocument;
    if (typeof getRuntimeDocument !== "function") {
        throw new TypeError(
            "createDataPointFilterControl requires a document provider"
        );
    }

    const runtimeDocument = getRuntimeDocument();
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
            const getRuntimeQueueMicrotask = scope.getQueueMicrotask;
            if (typeof getRuntimeQueueMicrotask !== "function") {
                throw new TypeError(
                    "createDataPointFilterControl requires a queueMicrotask provider"
                );
            }

            const microtaskScheduler = getRuntimeQueueMicrotask();
            if (typeof microtaskScheduler === "function") {
                microtaskScheduler(callback);
                return;
            }

            // eslint-disable-next-line promise/no-callback-in-promise, promise/prefer-await-to-then -- Preserve the existing Promise microtask fallback when queueMicrotask is unavailable.
            void Promise.resolve().then(callback);
        },
    };
}

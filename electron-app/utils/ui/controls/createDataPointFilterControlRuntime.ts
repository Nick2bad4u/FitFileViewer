export interface CreateDataPointFilterControlRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly queueMicrotask?: typeof queueMicrotask | undefined;
}

export interface CreateDataPointFilterControlRuntime {
    createAbortController: () => AbortController;
    createOption: () => HTMLOptionElement;
    scheduleMicrotask: (callback: VoidFunction) => void;
}

const defaultCreateDataPointFilterControlRuntimeScope: CreateDataPointFilterControlRuntimeScope =
    globalThis;

function getAbortControllerConstructor(
    scope: CreateDataPointFilterControlRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
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
    const runtimeDocument = scope.document;
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
            const microtaskScheduler =
                scope.queueMicrotask ??
                scope.document?.defaultView?.queueMicrotask;
            if (typeof microtaskScheduler === "function") {
                microtaskScheduler(callback);
                return;
            }

            // eslint-disable-next-line promise/no-callback-in-promise, promise/prefer-await-to-then -- Preserve the existing Promise microtask fallback when queueMicrotask is unavailable.
            void Promise.resolve().then(callback);
        },
    };
}

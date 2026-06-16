export interface AddFullScreenButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly documentEventTarget?: AddFullScreenButtonEventTarget | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?:
        | (() => AddFullScreenButtonEventTarget | undefined)
        | undefined;
    readonly getGlobalEventTarget?:
        | (() => AddFullScreenButtonEventTarget | undefined)
        | undefined;
    readonly globalEventTarget?: AddFullScreenButtonEventTarget | undefined;
}

type AddFullScreenButtonEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export interface AddFullScreenButtonRuntime {
    addDocumentEventListener: (
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions
    ) => void;
    addWindowEventListener: (
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    removeDocumentEventListener: (
        type: string,
        listener: EventListener
    ) => void;
    removeWindowEventListener: (type: string, listener: EventListener) => void;
}

function getAbortControllerConstructor(
    scope: AddFullScreenButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ?? scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocumentEventTarget(
    scope: AddFullScreenButtonRuntimeScope
): AddFullScreenButtonEventTarget | undefined {
    return scope.getDocumentEventTarget?.() ?? scope.documentEventTarget;
}

function getGlobalEventTarget(
    scope: AddFullScreenButtonRuntimeScope
): AddFullScreenButtonEventTarget | undefined {
    return scope.getGlobalEventTarget?.() ?? scope.globalEventTarget;
}

const defaultAddFullScreenButtonRuntimeScope: AddFullScreenButtonRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocumentEventTarget: () => globalThis.document,
        getGlobalEventTarget: () =>
            typeof globalThis.addEventListener === "function" &&
            typeof globalThis.removeEventListener === "function"
                ? globalThis
                : undefined,
    };

export function getAddFullScreenButtonRuntime(
    scope: AddFullScreenButtonRuntimeScope = defaultAddFullScreenButtonRuntimeScope
): AddFullScreenButtonRuntime {
    return {
        addDocumentEventListener(type, listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            documentEventTarget?.addEventListener(type, listener, options);
        },
        addWindowEventListener(type, listener, options): void {
            const globalEventTarget = getGlobalEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            globalEventTarget?.addEventListener(type, listener, options);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        removeDocumentEventListener(type, listener): void {
            const documentEventTarget = getDocumentEventTarget(scope);

            documentEventTarget?.removeEventListener(type, listener);
        },
        removeWindowEventListener(type, listener): void {
            const globalEventTarget = getGlobalEventTarget(scope);

            globalEventTarget?.removeEventListener(type, listener);
        },
    };
}

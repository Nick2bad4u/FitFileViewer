export interface AddFullScreenButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly documentTarget?: AddFullScreenButtonEventTarget | undefined;
    readonly windowTarget?: AddFullScreenButtonEventTarget | undefined;
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
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addFullScreenButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getAddFullScreenButtonRuntime(
    scope: AddFullScreenButtonRuntimeScope = {
        AbortController: globalThis.AbortController,
        documentTarget: globalThis.document,
        windowTarget: globalThis,
    }
): AddFullScreenButtonRuntime {
    return {
        addDocumentEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            scope.documentTarget?.addEventListener(type, listener, options);
        },
        addWindowEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned AbortSignal cleanup and matching remove methods.
            scope.windowTarget?.addEventListener(type, listener, options);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        removeDocumentEventListener(type, listener): void {
            scope.documentTarget?.removeEventListener(type, listener);
        },
        removeWindowEventListener(type, listener): void {
            scope.windowTarget?.removeEventListener(type, listener);
        },
    };
}

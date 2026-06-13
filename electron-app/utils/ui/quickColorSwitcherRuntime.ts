export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface QuickColorSwitcherRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => QuickColorSwitcherTimerHandle)
        | undefined;
}

export interface QuickColorSwitcherRuntime {
    addDocumentClickListener(
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    clearTimeout(handle: QuickColorSwitcherTimerHandle): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        timeout: number
    ): QuickColorSwitcherTimerHandle;
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = globalThis
): QuickColorSwitcherRuntime {
    return {
        addDocumentClickListener(
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const runtimeDocument = scope.document;
            if (!runtimeDocument) {
                throw new TypeError(
                    "quickColorSwitcher requires a document runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            runtimeDocument.addEventListener("click", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}

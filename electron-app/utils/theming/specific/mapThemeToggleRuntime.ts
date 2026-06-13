export type MapThemeToggleTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface MapThemeToggleRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => MapThemeToggleTimerHandle)
        | undefined;
}

export interface MapThemeToggleRuntime {
    addDocumentListener(
        eventName: string,
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    clearTimeout(handle: MapThemeToggleTimerHandle): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        timeout: number
    ): MapThemeToggleTimerHandle;
}

export function getMapThemeToggleRuntime(
    scope: MapThemeToggleRuntimeScope = globalThis
): MapThemeToggleRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            if (!runtimeDocument) {
                return;
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            runtimeDocument.addEventListener(eventName, listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, timeout): MapThemeToggleTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}

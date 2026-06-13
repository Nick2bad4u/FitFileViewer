export type ShownFilesListTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface ShownFilesListViewport {
    readonly height: number;
    readonly width: number;
}

export type ShownFilesListMouseMoveListener = (event: MouseEvent) => void;

export interface ShownFilesListRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?:
        | ((
              type: "mousemove",
              listener: ShownFilesListMouseMoveListener,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => ShownFilesListTimerHandle)
        | undefined;
}

export interface ShownFilesListRuntime {
    addBodyThemeChangeListener(
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    addMouseMoveListener(
        listener: ShownFilesListMouseMoveListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    clearTimeout(handle: ShownFilesListTimerHandle): void;
    createAbortController(): AbortController;
    getViewport(): ShownFilesListViewport;
    setTimeout(
        callback: () => void,
        timeout: number
    ): ShownFilesListTimerHandle;
}

export function getShownFilesListRuntime(
    scope: ShownFilesListRuntimeScope = globalThis
): ShownFilesListRuntime {
    return {
        addBodyThemeChangeListener(
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const body = scope.document?.body ?? globalThis.document?.body;
            if (!body) {
                throw new TypeError(
                    "shownFilesList requires a document body runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            body.addEventListener("themechange", listener, {
                ...options,
                signal: options.signal,
            });
        },
        addMouseMoveListener(
            listener: ShownFilesListMouseMoveListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            if (typeof scope.addEventListener === "function") {
                scope.addEventListener("mousemove", listener, {
                    ...options,
                    signal: options.signal,
                });
                return;
            }

            if (typeof globalThis.addEventListener !== "function") {
                throw new TypeError(
                    "shownFilesList requires an event target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            globalThis.addEventListener("mousemove", listener as EventListener, {
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
                    "shownFilesList requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getViewport(): ShownFilesListViewport {
            const width = scope.innerWidth ?? globalThis.innerWidth;
            const height = scope.innerHeight ?? globalThis.innerHeight;
            if (typeof width !== "number" || typeof height !== "number") {
                throw new TypeError(
                    "shownFilesList requires a viewport runtime"
                );
            }

            return { height, width };
        },
        setTimeout(callback, timeout): ShownFilesListTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}

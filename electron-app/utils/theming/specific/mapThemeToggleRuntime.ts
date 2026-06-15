export type MapThemeToggleTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface MapThemeToggleRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly CustomEvent?: typeof CustomEvent | undefined;
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
    createMapThemeChangedEvent(
        eventName: string,
        inverted: boolean
    ): CustomEvent<{ inverted: boolean }>;
    dispatchDocumentEvent(event: Event): boolean;
    setTimeout(
        callback: () => void,
        timeout: number
    ): MapThemeToggleTimerHandle;
}

function getCustomEventConstructor(
    scope: MapThemeToggleRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.CustomEvent;
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("mapThemeToggle requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDocument(scope: MapThemeToggleRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("mapThemeToggle requires a document runtime");
    }

    return runtimeDocument;
}

const defaultMapThemeToggleRuntimeScope: MapThemeToggleRuntimeScope =
    globalThis;

export function getMapThemeToggleRuntime(
    scope: MapThemeToggleRuntimeScope = defaultMapThemeToggleRuntimeScope
): MapThemeToggleRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            getDocument(scope).addEventListener(eventName, listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a clearTimeout runtime"
                );
            }

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
        createMapThemeChangedEvent(
            eventName: string,
            inverted: boolean
        ): CustomEvent<{ inverted: boolean }> {
            return new (getCustomEventConstructor(scope))(eventName, {
                bubbles: true,
                detail: { inverted },
            });
        },
        dispatchDocumentEvent(event: Event): boolean {
            return getDocument(scope).dispatchEvent(event);
        },
        setTimeout(callback, timeout): MapThemeToggleTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}

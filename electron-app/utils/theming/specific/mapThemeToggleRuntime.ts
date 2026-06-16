export type MapThemeToggleTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type MapThemeToggleSetTimeout = (
    callback: () => void,
    timeout: number
) => MapThemeToggleTimerHandle;

export interface MapThemeToggleRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => MapThemeToggleSetTimeout | undefined)
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
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("mapThemeToggle requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDocument(scope: MapThemeToggleRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapThemeToggle requires a document runtime");
    }

    return runtimeDocument;
}

const defaultMapThemeToggleRuntimeScope: MapThemeToggleRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getCustomEvent: () => globalThis.CustomEvent,
    getDocument: () => globalThis.document,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getMapThemeToggleRuntime(
    scope: MapThemeToggleRuntimeScope = defaultMapThemeToggleRuntimeScope
): MapThemeToggleRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            getDocument(scope).addEventListener(eventName, listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
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
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}

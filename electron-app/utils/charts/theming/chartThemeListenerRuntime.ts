export type ChartThemeListenerTimerHandle = ReturnType<typeof setTimeout>;

export interface ChartThemeListenerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly document?: Pick<Document, "body"> | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
}

export interface ChartThemeListenerRuntime {
    addThemeChangeListener: (
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    clearTimeout: (handle: ChartThemeListenerTimerHandle) => void;
    createAbortController: () => AbortController;
    isCustomEvent: (event: Event) => event is CustomEvent<unknown>;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ChartThemeListenerTimerHandle;
}

const defaultChartThemeListenerRuntimeScope: ChartThemeListenerRuntimeScope = {
    get AbortController() {
        return globalThis.AbortController;
    },
    get clearTimeout() {
        return globalThis.clearTimeout;
    },
    get CustomEvent() {
        return globalThis.CustomEvent;
    },
    get document() {
        return globalThis.document;
    },
    get setTimeout() {
        return globalThis.setTimeout;
    },
};

function getBody(scope: ChartThemeListenerRuntimeScope): HTMLElement {
    const body = scope.document?.body;
    if (!body) {
        throw new TypeError("chartThemeListener requires a document body");
    }

    return body;
}

function getAbortControllerConstructor(
    scope: ChartThemeListenerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ??
        scope.document?.body.ownerDocument.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartThemeListener requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: ChartThemeListenerRuntimeScope
): typeof CustomEvent | undefined {
    return (
        scope.CustomEvent ??
        scope.document?.body.ownerDocument.defaultView?.CustomEvent
    );
}

export function getChartThemeListenerRuntime(
    scope: ChartThemeListenerRuntimeScope = defaultChartThemeListenerRuntimeScope
): ChartThemeListenerRuntime {
    return {
        addThemeChangeListener(
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            getBody(scope).addEventListener("themechange", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle: ChartThemeListenerTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "chartThemeListener requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        isCustomEvent(event: Event): event is CustomEvent<unknown> {
            const CustomEventConstructor = getCustomEventConstructor(scope);
            return (
                typeof CustomEventConstructor === "function" &&
                event instanceof CustomEventConstructor
            );
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ChartThemeListenerTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "chartThemeListener requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(handler, timeout);
        },
    };
}

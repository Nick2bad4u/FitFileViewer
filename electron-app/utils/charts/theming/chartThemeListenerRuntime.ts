export type ChartThemeListenerTimerHandle = ReturnType<typeof setTimeout>;

export interface ChartThemeListenerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof clearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getDocument?:
        | (() => Pick<Document, "body"> | undefined)
        | undefined;
    readonly getSetTimeout?: (() => typeof setTimeout | undefined) | undefined;
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
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getCustomEvent: () => globalThis.CustomEvent,
    getDocument: () => globalThis.document,
    getSetTimeout: () => globalThis.setTimeout,
};

function getBody(scope: ChartThemeListenerRuntimeScope): HTMLElement {
    const body = scope.getDocument?.()?.body;
    if (!body) {
        throw new TypeError("chartThemeListener requires a document body");
    }

    return body;
}

function getAbortControllerConstructor(
    scope: ChartThemeListenerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartThemeListener requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: ChartThemeListenerRuntimeScope
): typeof CustomEvent | undefined {
    return scope.getCustomEvent?.();
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
            const clearTimeoutRef = scope.getClearTimeout?.();
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
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "chartThemeListener requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(handler, timeout);
        },
    };
}

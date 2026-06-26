import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserCustomEventConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type ChartThemeListenerTimerHandle = BrowserTimerHandle;

export interface ChartThemeListenerRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => BrowserCustomEventConstructor | undefined)
        | undefined;
    readonly getDocument?:
        | (() => Pick<Document, "body"> | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
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
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getSetTimeout: getBrowserSetTimeout,
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
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartThemeListener requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: ChartThemeListenerRuntimeScope
): BrowserCustomEventConstructor | undefined {
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

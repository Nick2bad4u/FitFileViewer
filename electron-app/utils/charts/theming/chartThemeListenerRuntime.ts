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
    readonly getAbortController: ChartThemeListenerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: ChartThemeListenerRuntimeProvider<BrowserClearTimeout>;
    readonly getCustomEvent: ChartThemeListenerRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDocument: ChartThemeListenerRuntimeProvider<
        Pick<Document, "body">
    >;
    readonly getSetTimeout: ChartThemeListenerRuntimeProvider<BrowserSetTimeout>;
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

type ChartThemeListenerRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultChartThemeListenerRuntimeScope: ChartThemeListenerRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getSetTimeout: getBrowserSetTimeout,
};

function getBody(
    getDocument: () => Pick<Document, "body"> | undefined
): HTMLElement {
    const body = getDocument()?.body;
    if (!body) {
        throw new TypeError("chartThemeListener requires a document body");
    }

    return body;
}

function getAbortControllerConstructor(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getAbortController();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartThemeListener requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    getCustomEvent: () => BrowserCustomEventConstructor | undefined
): BrowserCustomEventConstructor | undefined {
    return getCustomEvent();
}

export function getChartThemeListenerRuntime(
    scope: ChartThemeListenerRuntimeScope = defaultChartThemeListenerRuntimeScope
): ChartThemeListenerRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getCustomEvent = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        addThemeChangeListener(
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            getBody(getDocument).addEventListener("themechange", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle: ChartThemeListenerTimerHandle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "chartThemeListener requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(getAbortController))();
        },
        isCustomEvent(event: Event): event is CustomEvent<unknown> {
            const CustomEventConstructor =
                getCustomEventConstructor(getCustomEvent);
            return (
                typeof CustomEventConstructor === "function" &&
                event instanceof CustomEventConstructor
            );
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ChartThemeListenerTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "chartThemeListener requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(handler, timeout);
        },
    };
}

function getRequiredProvider<T>(
    provider: ChartThemeListenerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `chartThemeListener requires ${getProviderArticle(providerName)} ${providerName} provider`
        );
    }

    return provider;
}

function getProviderArticle(providerName: string): "a" | "an" {
    return providerName === "AbortController" ? "an" : "a";
}

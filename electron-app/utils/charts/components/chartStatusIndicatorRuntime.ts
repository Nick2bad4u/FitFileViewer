export type ChartStatusIndicatorTimerHandle = ReturnType<typeof setTimeout>;

export interface ChartStatusIndicatorRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
}

export interface ChartStatusIndicatorViewport {
    readonly height: number;
    readonly width: number;
}

export interface ChartStatusIndicatorRuntime {
    addChartsRenderedListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    addFieldToggleChangedListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    clearTimeout: (handle: ChartStatusIndicatorTimerHandle) => void;
    createAbortController: () => AbortController;
    getBody: () => HTMLElement;
    getViewport: () => ChartStatusIndicatorViewport;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    querySelector: (selector: string) => HTMLElement | null;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ChartStatusIndicatorTimerHandle;
}

const defaultChartStatusIndicatorRuntimeScope: ChartStatusIndicatorRuntimeScope =
    globalThis;

function getAbortControllerConstructor(
    scope: ChartStatusIndicatorRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires an AbortController"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: ChartStatusIndicatorRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("chartStatusIndicator requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: ChartStatusIndicatorRuntimeScope
): typeof HTMLElement | undefined {
    return scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
}

function isHTMLElement(
    scope: ChartStatusIndicatorRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

function getRequiredClearTimeout(
    scope: ChartStatusIndicatorRuntimeScope
): typeof clearTimeout {
    const clearTimeoutRef = scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires a clearTimeout runtime"
        );
    }

    return clearTimeoutRef;
}

function getRequiredSetTimeout(
    scope: ChartStatusIndicatorRuntimeScope
): typeof setTimeout {
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires a setTimeout runtime"
        );
    }

    return setTimeoutRef;
}

export function getChartStatusIndicatorRuntime(
    scope: ChartStatusIndicatorRuntimeScope = defaultChartStatusIndicatorRuntimeScope
): ChartStatusIndicatorRuntime {
    return {
        addChartsRenderedListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            getDocument(scope).addEventListener("chartsRendered", listener, {
                ...options,
                signal: options.signal,
            });
        },
        addFieldToggleChangedListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            scope.addEventListener?.("fieldToggleChanged", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle: ChartStatusIndicatorTimerHandle): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        getBody(): HTMLElement {
            return getDocument(scope).body;
        },
        getViewport(): ChartStatusIndicatorViewport {
            return {
                height: scope.innerHeight ?? 0,
                width: scope.innerWidth ?? 0,
            };
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            return isHTMLElement(scope, value);
        },
        querySelector(selector: string): HTMLElement | null {
            const element = getDocument(scope).querySelector(selector);
            return isHTMLElement(scope, element) ? element : null;
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ChartStatusIndicatorTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(handler, timeout);
        },
    };
}

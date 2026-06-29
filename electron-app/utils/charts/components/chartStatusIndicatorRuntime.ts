import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

export type ChartStatusIndicatorTimerHandle = BrowserTimerHandle;

type ChartStatusIndicatorEventListener =
    | EventListener
    | Readonly<EventListenerObject>;
type ChartStatusIndicatorAddEventListener = (
    type: string,
    listener: ChartStatusIndicatorEventListener,
    options?: Readonly<AddEventListenerOptions> | boolean
) => void;

export interface ChartStatusIndicatorRuntimeScope {
    readonly getAbortController: () =>
        | BrowserAbortControllerConstructor
        | undefined;
    readonly getAddEventListener: () =>
        | ChartStatusIndicatorAddEventListener
        | undefined;
    readonly getClearTimeout: () => BrowserClearTimeout | undefined;
    readonly getDocument: () => Document | undefined;
    readonly getHTMLElement: () => BrowserHTMLElementConstructor | undefined;
    readonly getSetTimeout: () => BrowserSetTimeout | undefined;
    readonly getViewport: () => ChartStatusIndicatorViewport | undefined;
}

export interface ChartStatusIndicatorViewport {
    readonly height: number;
    readonly width: number;
}

export interface ChartStatusIndicatorRuntime {
    readonly addChartsRenderedListener: (
        listener: ChartStatusIndicatorEventListener,
        options: Readonly<AddEventListenerOptions> & {
            readonly signal: AbortSignal;
        }
    ) => void;
    readonly addFieldToggleChangedListener: (
        listener: ChartStatusIndicatorEventListener,
        options: Readonly<AddEventListenerOptions> & {
            readonly signal: AbortSignal;
        }
    ) => void;
    readonly clearTimeout: (handle: ChartStatusIndicatorTimerHandle) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createTextNode: (data: string) => Text;
    readonly getBody: () => HTMLElement;
    readonly getDocument: () => Document;
    readonly getViewport: () => ChartStatusIndicatorViewport;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly querySelector: (selector: string) => HTMLElement | null;
    readonly setTimeout: (
        handler: () => void,
        timeout: number
    ) => ChartStatusIndicatorTimerHandle;
}

const defaultChartStatusIndicatorRuntimeScope: ChartStatusIndicatorRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getAddEventListener: getBrowserAddEventListener,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getSetTimeout: getBrowserSetTimeout,
        getViewport: getBrowserViewport,
    };

function getAbortControllerConstructor(
    scope: ChartStatusIndicatorRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "an AbortController provider"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartStatusIndicator requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getAddEventListener(
    scope: ChartStatusIndicatorRuntimeScope
): ChartStatusIndicatorAddEventListener | undefined {
    return getRequiredProvider(
        scope.getAddEventListener,
        "an event listener provider"
    )();
}

function getDocument(scope: ChartStatusIndicatorRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "a document provider"
    )();
    if (!runtimeDocument) {
        throw new TypeError("chartStatusIndicator requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: ChartStatusIndicatorRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(
        scope.getHTMLElement,
        "an HTMLElement provider"
    )();
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
): BrowserClearTimeout {
    const clearTimeoutRef = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout provider"
    )();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires a clearTimeout runtime"
        );
    }

    return clearTimeoutRef;
}

function getRequiredSetTimeout(
    scope: ChartStatusIndicatorRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout provider"
    )();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires a setTimeout runtime"
        );
    }

    return setTimeoutRef;
}

function getRequiredProvider<T>(
    provider: (() => T | undefined) | undefined,
    providerDescription: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `chartStatusIndicator requires ${providerDescription}`
        );
    }

    return provider;
}

function getViewport(
    scope: ChartStatusIndicatorRuntimeScope
): ChartStatusIndicatorViewport | undefined {
    return getRequiredProvider(scope.getViewport, "a viewport provider")();
}

export function getChartStatusIndicatorRuntime(
    scope: ChartStatusIndicatorRuntimeScope = defaultChartStatusIndicatorRuntimeScope
): ChartStatusIndicatorRuntime {
    return {
        addChartsRenderedListener(
            listener: ChartStatusIndicatorEventListener,
            options: Readonly<AddEventListenerOptions> & {
                readonly signal: AbortSignal;
            }
        ): void {
            getDocument(scope).addEventListener("chartsRendered", listener, {
                ...options,
                signal: options.signal,
            });
        },
        addFieldToggleChangedListener(
            listener: ChartStatusIndicatorEventListener,
            options: Readonly<AddEventListenerOptions> & {
                readonly signal: AbortSignal;
            }
        ): void {
            getAddEventListener(scope)?.("fieldToggleChanged", listener, {
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
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        createTextNode(data: string): Text {
            return getDocument(scope).createTextNode(data);
        },
        getBody(): HTMLElement {
            return getDocument(scope).body;
        },
        getDocument(): Document {
            return getDocument(scope);
        },
        getViewport(): ChartStatusIndicatorViewport {
            return getViewport(scope) ?? { height: 0, width: 0 };
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

import {
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

export type ChartStatusIndicatorTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

type ChartStatusIndicatorEventListener =
    | EventListener
    | Readonly<EventListenerObject>;
type ChartStatusIndicatorAddEventListener = (
    type: string,
    listener: ChartStatusIndicatorEventListener,
    options?: Readonly<AddEventListenerOptions> | boolean
) => void;

export interface ChartStatusIndicatorRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => ChartStatusIndicatorAddEventListener | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly getViewport?:
        | (() => ChartStatusIndicatorViewport | undefined)
        | undefined;
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
): typeof globalThis.AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError("chartStatusIndicator requires an AbortController");
    }

    return AbortControllerConstructor;
}

function getDocument(scope: ChartStatusIndicatorRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("chartStatusIndicator requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: ChartStatusIndicatorRuntimeScope
): typeof globalThis.HTMLElement | undefined {
    return scope.getHTMLElement?.();
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
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError(
            "chartStatusIndicator requires a clearTimeout runtime"
        );
    }

    return clearTimeoutRef;
}

function getRequiredSetTimeout(
    scope: ChartStatusIndicatorRuntimeScope
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
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
            scope.getAddEventListener?.()?.("fieldToggleChanged", listener, {
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
            return scope.getViewport?.() ?? { height: 0, width: 0 };
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
